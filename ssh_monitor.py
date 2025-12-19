"""
SSH Log Monitor - Canlı log izleme modülü
Uzak sunucuya SSH ile bağlanıp log dosyasını gerçek zamanlı izler.
"""

import paramiko
import threading
import queue
import re
from datetime import datetime
from typing import Generator, Dict, Any, Optional
import time


class SSHLogMonitor:
    """SSH üzerinden log dosyası izleme sınıfı"""
    
    # Log satırı parsing pattern'leri
    THREAT_PATTERNS = {
        'BRUTE_FORCE': {
            'pattern': r'Failed password|Failed publickey|authentication failure.*rhost=',
            'severity': 'HIGH',
            'description': 'Başarısız giriş denemesi tespit edildi'
        },
        'INVALID_USER': {
            'pattern': r'Invalid user|user unknown',
            'severity': 'HIGH', 
            'description': 'Geçersiz kullanıcı ile giriş denemesi'
        },
        'ROOT_LOGIN': {
            'pattern': r'Accepted.*for root|session opened.*root',
            'severity': 'CRITICAL',
            'description': 'Root kullanıcısı ile giriş yapıldı'
        },
        'LOGIN_SUCCESS': {
            'pattern': r'Accepted password|Accepted publickey',
            'severity': 'INFO',
            'description': 'Başarılı giriş'
        },
        'SESSION_OPENED': {
            'pattern': r'session opened|New session',
            'severity': 'INFO',
            'description': 'Oturum açıldı'
        },
        'SESSION_CLOSED': {
            'pattern': r'session closed|Removed session|logged out',
            'severity': 'INFO',
            'description': 'Oturum kapatıldı'
        },
        'SUDO_USAGE': {
            'pattern': r'sudo:.*COMMAND=',
            'severity': 'MEDIUM',
            'description': 'Sudo komutu çalıştırıldı'
        },
        'CONNECTION_CLOSED': {
            'pattern': r'Connection closed|Disconnected from',
            'severity': 'INFO',
            'description': 'Bağlantı kapatıldı'
        }
    }
    
    def __init__(self):
        self.client: Optional[paramiko.SSHClient] = None
        self.channel = None
        self.is_connected = False
        self.is_streaming = False
        self.log_queue = queue.Queue()
        self.stream_thread = None
        self.connection_info = {}
        
    def connect(self, host: str, username: str, password: str = None, 
                key_path: str = None, port: int = 22) -> Dict[str, Any]:
        """SSH bağlantısı kur"""
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            connect_kwargs = {
                'hostname': host,
                'port': port,
                'username': username,
                'timeout': 10
            }
            
            if key_path:
                connect_kwargs['key_filename'] = key_path
            elif password:
                connect_kwargs['password'] = password
            else:
                return {'success': False, 'error': 'Şifre veya SSH anahtarı gerekli'}
            
            self.client.connect(**connect_kwargs)
            self.is_connected = True
            self.connection_info = {
                'host': host,
                'port': port,
                'username': username,
                'connected_at': datetime.now().isoformat()
            }
            
            return {
                'success': True,
                'message': f'{username}@{host}:{port} bağlantısı kuruldu',
                'connection': self.connection_info
            }
            
        except paramiko.AuthenticationException:
            return {'success': False, 'error': 'Kimlik doğrulama başarısız - şifre veya anahtar hatalı'}
        except paramiko.SSHException as e:
            return {'success': False, 'error': f'SSH hatası: {str(e)}'}
        except Exception as e:
            return {'success': False, 'error': f'Bağlantı hatası: {str(e)}'}
    
    def disconnect(self) -> Dict[str, Any]:
        """SSH bağlantısını kapat"""
        self.is_streaming = False
        
        if self.channel:
            try:
                self.channel.close()
            except:
                pass
            self.channel = None
            
        if self.client:
            try:
                self.client.close()
            except:
                pass
            self.client = None
            
        self.is_connected = False
        return {'success': True, 'message': 'Bağlantı kapatıldı'}
    
    def parse_log_line(self, line: str) -> Dict[str, Any]:
        """Log satırını parse et ve tehdit analizi yap"""
        # Temel log bilgilerini çıkar
        parsed = {
            'raw': line.strip(),
            'timestamp': datetime.now().isoformat(),
            'threat_type': None,
            'severity': 'INFO',
            'description': line.strip(),
            'source_ip': None,
            'username': None
        }
        
        # Timestamp pattern (syslog formatı)
        timestamp_match = re.search(
            r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s]*|\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2})',
            line
        )
        if timestamp_match:
            parsed['log_timestamp'] = timestamp_match.group(1)
        
        # IP adresi çıkar
        ip_match = re.search(r'from\s+(\d+\.\d+\.\d+\.\d+)|rhost=(\d+\.\d+\.\d+\.\d+)', line)
        if ip_match:
            parsed['source_ip'] = ip_match.group(1) or ip_match.group(2)
        
        # Kullanıcı adı çıkar
        user_match = re.search(r'for\s+(\w+)|user[=\s]+(\w+)|USER=(\w+)', line)
        if user_match:
            parsed['username'] = user_match.group(1) or user_match.group(2) or user_match.group(3)
        
        # Tehdit tespiti
        for threat_type, config in self.THREAT_PATTERNS.items():
            if re.search(config['pattern'], line, re.IGNORECASE):
                parsed['threat_type'] = threat_type
                parsed['severity'] = config['severity']
                parsed['description'] = config['description']
                
                # Detaylı açıklama oluştur
                if parsed['source_ip']:
                    parsed['description'] += f" (Kaynak: {parsed['source_ip']})"
                if parsed['username']:
                    parsed['description'] += f" - Kullanıcı: {parsed['username']}"
                break
        
        return parsed
    
    def start_log_stream(self, log_path: str = '/var/log/auth.log') -> Generator[Dict[str, Any], None, None]:
        """Log dosyasını izlemeye başla ve satırları yield et"""
        if not self.is_connected or not self.client:
            yield {'error': 'SSH bağlantısı yok', 'success': False}
            return
        
        self.is_streaming = True
        
        try:
            # tail -n 50 -f komutu ile son 50 satırı al ve takibe devam et
            stdin, stdout, stderr = self.client.exec_command(
                f'tail -n 50 -f {log_path}',
                get_pty=True
            )
            
            self.channel = stdout.channel
            self.channel.settimeout(0.5)  # Non-blocking read
            
            buffer = ""
            
            while self.is_streaming:
                try:
                    if self.channel.recv_ready():
                        data = self.channel.recv(4096).decode('utf-8', errors='ignore')
                        buffer += data
                        
                        # Satır satır işle
                        while '\n' in buffer:
                            line, buffer = buffer.split('\n', 1)
                            if line.strip():
                                parsed = self.parse_log_line(line)
                                yield parsed
                    else:
                        time.sleep(0.1)  # CPU kullanımını azalt
                        
                except socket.timeout:
                    continue
                except Exception as e:
                    if self.is_streaming:
                        yield {'error': str(e), 'success': False}
                    break
                    
        except Exception as e:
            yield {'error': f'Stream hatası: {str(e)}', 'success': False}
        finally:
            self.is_streaming = False


# Global instance
ssh_monitor = SSHLogMonitor()


def get_monitor() -> SSHLogMonitor:
    """Global SSH monitor instance'ını döndür"""
    return ssh_monitor
