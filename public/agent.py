#!/usr/bin/env python3
"""
LogIz Agent - Sunucu Log Toplama Ajanı
======================================
Bu script sunucunuzda çalışarak log dosyalarını izler ve 
LogIz dashboard'a gerçek zamanlı olarak gönderir.

Kullanım:
    python agent.py <API_KEY> <SERVER_URL>
    
Örnek:
    python agent.py sk_abc123... http://localhost:3000
    python agent.py sk_abc123... https://logiz.example.com
"""

import sys
import time
import requests
import os
import platform
import random

# Yapılandırma
API_URL = "http://localhost:3000/api/ingest" 
LOG_FILE = "/var/log/auth.log" if platform.system() != "Windows" else "C:\\Windows\\System32\\winevt\\Logs\\Security.evtx"

# Demo log örnekleri
DEMO_LOGS = [
    "Failed password for invalid user admin from 192.168.1.5 port 22",
    "Accepted password for root from 10.0.0.2 port 22",
    "Failed password for user guest from 172.16.0.100 port 22",
    "Disconnected from user root 10.0.0.2",
    "uid=0(root) gid=0(root) groups=0(root)",
    "New session 123 of user root",
    "Failed password for invalid user test from 203.0.113.50 port 22",
    "Connection closed by authenticating user admin 192.168.1.1 port 22",
    "Received disconnect from 10.10.10.10 port 22: User initiated",
    "PAM 2 more authentication failures for admin",
    "Invalid user scanner from 45.33.32.156 port 52341",
    "Failed password for root from 185.220.101.35 port 44532",
    "Accepted publickey for deploy from 10.0.0.50 port 22",
    "session opened for user www-data",
    "sudo: pam_unix(sudo:session): session opened for user root",
]

def follow(thefile):
    """Log dosyasını canlı takip eden jeneratör (tail -f benzeri)"""
    thefile.seek(0, 2)
    while True:
        line = thefile.readline()
        if not line:
            time.sleep(0.1)
            continue
        yield line

def run_demo_mode(hostname, api_key):
    """Demo modu: Rastgele log üretir"""
    print("[*] Demo moduna geçiliyor - Rastgele veri gönderilecek...")
    print("[*] Ctrl+C ile durdurun\n")
    
    while True:
        line = random.choice(DEMO_LOGS)
        send_log(line, hostname, api_key)
        time.sleep(random.uniform(2, 5))

def main():
    if len(sys.argv) < 2:
        print("=" * 50)
        print("LogIz Agent - Sunucu Log Toplama Ajanı")
        print("=" * 50)
        print("\nKullanım: python agent.py <API_KEY> [SERVER_URL]")
        print("Örnek: python agent.py sk_xxx123 http://localhost:3000")
        print("\nAPI Key'inizi LogIz Dashboard > Ajan Yönetimi sayfasından alabilirsiniz.")
        sys.exit(1)

    api_key = sys.argv[1]
    global API_URL
    if len(sys.argv) > 2:
        API_URL = sys.argv[2].rstrip('/') + "/api/ingest"

    hostname = platform.node()
    
    print("=" * 50)
    print("LogIz Ajanı Başlatıldı")
    print("=" * 50)
    print(f"[*] Sunucu: {hostname}")
    print(f"[*] Hedef: {API_URL}")
    print(f"[*] Platform: {platform.system()}")

    # Dosya kontrolü - yoksa veya erişilemezse demo moduna geç
    use_demo = False
    
    if not os.path.exists(LOG_FILE):
        print(f"[!] Log dosyası bulunamadı: {LOG_FILE}")
        use_demo = True
    else:
        # Dosya var ama erişebiliyor muyuz?
        try:
            with open(LOG_FILE, "r") as test:
                pass
        except PermissionError:
            print(f"[!] Erişim reddedildi: {LOG_FILE}")
            print("[!] (Admin/root olarak çalıştırın veya demo mod kullanılacak)")
            use_demo = True
        except Exception as e:
            print(f"[!] Dosya hatası: {e}")
            use_demo = True

    try:
        if use_demo:
            run_demo_mode(hostname, api_key)
        else:
            print(f"[*] İzlenen Dosya: {LOG_FILE}\n")
            with open(LOG_FILE, "r") as logfile:
                for line in follow(logfile):
                    send_log(line, hostname, api_key)
    except KeyboardInterrupt:
        print("\n[*] Ajan durduruldu.")

def send_log(line, hostname, api_key):
    """API'ye log gönderir"""
    payload = {
        "log": line.strip(),
        "source": hostname,
        "timestamp": time.time()
    }
    
    try:
        response = requests.post(
            API_URL, 
            json=payload, 
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=5
        )
        if response.status_code == 201:
            print(f"[+] Gönderildi: {line.strip()[:50]}...")
        elif response.status_code == 401:
            print(f"[!] Yetkilendirme hatası: API anahtarınızı kontrol edin")
        else:
            print(f"[!] API Hatası ({response.status_code}): {response.text[:100]}")
    except requests.exceptions.ConnectionError:
        print(f"[!] Bağlantı hatası: Sunucuya ulaşılamıyor ({API_URL})")
    except Exception as e:
        print(f"[!] Hata: {e}")

if __name__ == "__main__":
    main()
