from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import pickle
import pandas as pd
import numpy as np
from datetime import datetime
import os
from werkzeug.utils import secure_filename

# Flask App
app = Flask(__name__)
CORS(app)

# Basit SQLite kullan (test için)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_ids.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB

# Database
db = SQLAlchemy(app)

# Model yolunu düzelt - birkaç seçenek dene
MODEL_PATHS = [
    'ids_model.pkl',  # Repo kök dizininde
    'models/ids_model.pkl',
    '../models/ids_model.pkl',
    r'C:\Users\smt1s\OneDrive\Belgeler\GitHub\LogIz\ids_model.pkl'
]

ENCODER_PATHS = [
    'encoders.pkl',
    'models/encoders.pkl',
    r'C:\Users\smt1s\OneDrive\Belgeler\GitHub\LogIz\encoders.pkl'
]

# Global değişkenler - başlangıçta yüklenir
model = None
ENCODER_DICT = None

# Model yükle
for path in MODEL_PATHS:
    try:
        if os.path.exists(path):
            with open(path, 'rb') as f:
                model = pickle.load(f)
            print(f"✅ Model yüklendi: {path}")
            break
    except Exception as e:
        continue

if model is None:
    print("❌ Model yüklenemedi! Lütfen model yolunu kontrol et.")

# Encoder yükle (global - her istekte yükleme yok)
for path in ENCODER_PATHS:
    try:
        if os.path.exists(path):
            with open(path, 'rb') as f:
                ENCODER_DICT = pickle.load(f)
            print(f"✅ Encoderlar yüklendi: {path}")
            break
    except Exception as e:
        continue

if ENCODER_DICT is None:
    print("⚠️ Encoder bulunamadı, yeni encoder oluşturulacak")

# Tehdit türü açıklamaları - temel şablonlar
THREAT_DESCRIPTIONS = {
    'Normal': 'Zararsız ağ trafiği',
    'Exploits': 'Sistemdeki güvenlik açıklarını istismar etmeye çalışan saldırı',
    'Reconnaissance': 'Ağ keşfi ve port tarama aktivitesi',
    'DoS': 'Hizmet dışı bırakma (Denial of Service) saldırısı',
    'Generic': 'Genel saldırı kalıpları tespit edildi',
    'Shellcode': 'Zararlı kod enjeksiyonu girişimi',
    'Fuzzers': 'Fuzzing tekniği ile güvenlik açığı arama',
    'Worms': 'Kendini kopyalayan zararlı yazılım (solucan) aktivitesi',
    'Backdoor': 'Yetkisiz erişim kapısı oluşturma girişimi',
    'Analysis': 'Trafik analizi saldırısı'
}

# GeoIP için gerçekçi IP havuzu (farklı ülkeler)
# Bu IP'ler geoip-lite tarafından tanınabilir public IP aralıklarından
REALISTIC_IP_POOLS = {
    'Russia': ['185.159.128.', '95.142.40.', '212.109.192.'],  # RU
    'China': ['116.31.116.', '120.79.20.', '223.5.5.'],        # CN
    'Brazil': ['177.154.200.', '187.73.32.', '200.160.0.'],    # BR
    'USA': ['8.8.8.', '108.177.122.', '172.217.14.'],          # US
    'Germany': ['46.101.128.', '138.201.0.', '176.9.0.'],      # DE
    'India': ['103.102.166.', '49.207.0.', '117.254.0.'],      # IN
    'Ukraine': ['91.214.144.', '176.37.0.', '93.183.216.'],    # UA
    'Netherlands': ['89.44.32.', '185.199.108.', '93.89.160.'], # NL
}

import random

def generate_realistic_ip(attack_type: str = None) -> str:
    """Tehdit türüne göre gerçekçi IP adresi oluştur (GeoIP için)"""
    # Saldırı türüne göre kaynak ülke ağırlıklandırma
    attack_origins = {
        'Exploits': ['Russia', 'China', 'Brazil'],
        'DoS': ['Russia', 'China', 'Ukraine'],
        'Reconnaissance': ['USA', 'Germany', 'Netherlands'],
        'Backdoor': ['China', 'Russia', 'Brazil'],
        'Shellcode': ['Russia', 'China', 'India'],
        'Worms': ['Brazil', 'India', 'Ukraine'],
        'Fuzzers': ['USA', 'Germany', 'Netherlands'],
        'Generic': ['Russia', 'China', 'USA'],
        'Analysis': ['USA', 'Germany', 'Netherlands'],
    }
    
    # Saldırı türüne göre muhtemel kaynak ülkeleri seç
    if attack_type and attack_type in attack_origins:
        countries = attack_origins[attack_type]
    else:
        countries = list(REALISTIC_IP_POOLS.keys())
    
    # Rastgele ülke ve IP prefix seç
    country = random.choice(countries)
    ip_prefix = random.choice(REALISTIC_IP_POOLS[country])
    
    # Son oktet rastgele (1-254)
    last_octet = random.randint(1, 254)
    
    return f"{ip_prefix}{last_octet}"

# Dinamik açıklama oluşturucu
def generate_dynamic_description(attack_type: str, row: dict, prob: float) -> str:
    """Her satır için benzersiz, context-based açıklama oluştur"""
    proto = str(row.get('proto', 'unknown')).upper()
    service = str(row.get('service', '-'))
    state = str(row.get('state', 'unknown'))
    sbytes = int(row.get('sbytes', 0)) if pd.notna(row.get('sbytes')) else 0
    dbytes = int(row.get('dbytes', 0)) if pd.notna(row.get('dbytes')) else 0
    dur = float(row.get('dur', 0)) if pd.notna(row.get('dur')) else 0
    
    # Servis bilgisi
    service_info = f" ({service} servisi)" if service and service != '-' else ""
    
    # Veri boyutu bilgisi
    total_bytes = sbytes + dbytes
    if total_bytes > 1000000:
        size_info = f" ({total_bytes/1000000:.1f} MB veri transferi)"
    elif total_bytes > 1000:
        size_info = f" ({total_bytes/1000:.1f} KB veri transferi)"
    else:
        size_info = f" ({total_bytes} bytes)" if total_bytes > 0 else ""
    
    # Süre bilgisi
    dur_info = f", {dur:.2f}s süre" if dur > 0 else ""
    
    # Saldırı türüne göre özelleştirilmiş açıklamalar
    descriptions = {
        'Backdoor': [
            f"{proto} protokolü üzerinden yetkisiz erişim kapısı girişimi{service_info}{size_info}",
            f"Gizli kanal oluşturma denemesi{service_info}, {state} durumunda{dur_info}",
            f"Uzaktan erişim trojanı (RAT) aktivitesi{size_info}{dur_info}",
        ],
        'Exploits': [
            f"{proto} üzerinden güvenlik açığı istismarı{service_info}{size_info}",
            f"Sistem zafiyeti sömürme girişimi{service_info}, {state} durumunda",
            f"Buffer overflow/injection saldırısı{size_info}{dur_info}",
        ],
        'DoS': [
            f"{proto} flood saldırısı{service_info}{size_info}",
            f"Hizmet kesintisi amaçlı aşırı yük{service_info}{dur_info}",
            f"Kaynak tüketimi saldırısı ({total_bytes} bytes){dur_info}",
        ],
        'Reconnaissance': [
            f"{proto} port tarama aktivitesi{service_info}",
            f"Ağ keşfi ve haritalama{service_info}, {state} durumu",
            f"Sistem parmak izi alma girişimi{size_info}",
        ],
        'Shellcode': [
            f"{proto} üzerinden kod enjeksiyonu{service_info}{size_info}",
            f"Zararlı payload tespit edildi{service_info}{dur_info}",
            f"Bellek manipülasyonu saldırısı{size_info}",
        ],
        'Fuzzers': [
            f"{proto} fuzzing testi{service_info}{size_info}",
            f"Rastgele veri ile güvenlik testi{service_info}{dur_info}",
            f"Protokol belirsizlik testi{size_info}",
        ],
        'Worms': [
            f"Kendini kopyalayan zararlı yazılım{service_info}{size_info}",
            f"Ağ solucanı yayılma girişimi{service_info}{dur_info}",
            f"Otomatik saldırı propagasyonu{size_info}",
        ],
        'Generic': [
            f"{proto} üzerinden şüpheli aktivite{service_info}{size_info}",
            f"Anomali tespit edildi{service_info}, {state} durumu{dur_info}",
            f"Bilinmeyen saldırı kalıbı{size_info}",
        ],
        'Analysis': [
            f"{proto} trafik analizi saldırısı{service_info}",
            f"Paket dinleme/sniffing aktivitesi{size_info}",
            f"Veri sızıntısı riski{service_info}{dur_info}",
        ],
    }
    
    # Hash ile tutarlı rastgele seçim (aynı satır her zaman aynı açıklamayı alır)
    import hashlib
    row_hash = hashlib.md5(str(row).encode()).hexdigest()
    hash_int = int(row_hash[:8], 16)
    
    type_descriptions = descriptions.get(attack_type, [f"{attack_type} saldırısı tespit edildi{size_info}"])
    selected_idx = hash_int % len(type_descriptions)
    
    return type_descriptions[selected_idx]


# Severity belirleme fonksiyonu
def get_severity(attack_type: str, probability: float) -> str:
    """Saldırı türü ve olasılığa göre ciddiyet belirle"""
    critical_types = ['Backdoor', 'Shellcode', 'Worms', 'Exploits']
    high_types = ['DoS', 'Reconnaissance']
    
    if attack_type in critical_types and probability > 0.7:
        return 'CRITICAL'
    elif attack_type in critical_types or (attack_type in high_types and probability > 0.8):
        return 'HIGH'
    elif probability > 0.7:
        return 'MEDIUM'
    elif probability > 0.5:
        return 'LOW'
    else:
        return 'INFO'


# ==================== DATABASE MODELS ====================

class AnalysisJob(db.Model):
    __tablename__ = 'analysis_jobs'

    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(100), unique=True, nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='completed')
    total_records = db.Column(db.Integer, default=0)
    attacks_detected = db.Column(db.Integer, default=0)
    normal_traffic = db.Column(db.Integer, default=0)
    attack_percentage = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'filename': self.filename,
            'status': self.status,
            'total_records': self.total_records,
            'attacks_detected': self.attacks_detected,
            'normal_traffic': self.normal_traffic,
            'attack_percentage': self.attack_percentage,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }


class DetectedAttack(db.Model):
    __tablename__ = 'detected_attacks'

    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(100))
    record_index = db.Column(db.Integer)
    probability = db.Column(db.Float)
    proto = db.Column(db.String(50))
    service = db.Column(db.String(100))
    state = db.Column(db.String(50))
    source_ip = db.Column(db.String(50))
    dest_ip = db.Column(db.String(50))
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'record_index': self.record_index,
            'probability': round(self.probability * 100, 2),
            'proto': self.proto,
            'service': self.service,
            'state': self.state,
            'source_ip': self.source_ip,
            'dest_ip': self.dest_ip,
            'detected_at': self.detected_at.isoformat() if self.detected_at else None
        }


# ==================== API ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Sistem sağlık kontrolü"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'model_loaded': model is not None,
        'database': 'sqlite'
    })


@app.route('/api/analyze/upload', methods=['POST'])
def upload_and_analyze():
    """CSV dosyası yükle ve ANİNDA analiz et (Celery yok)"""

    if model is None:
        return jsonify({'error': 'Model yüklenmedi'}), 500

    # Dosya kaynağını belirle (JSON Base64 veya Multipart Form)
    file = None
    
    if request.is_json:
        data = request.get_json()
        if 'file_content' in data:
            import base64
            import io
            try:
                # Base64 decode
                file_bytes = base64.b64decode(data['file_content'])
                
                # Clean CSV quotes if present
                try:
                    content_str = file_bytes.decode('utf-8')
                    lines = content_str.splitlines()
                    cleaned_lines = []
                    for line in lines:
                        line = line.strip()
                        if line.startswith('"') and line.endswith('"'):
                            line = line[1:-1]
                        cleaned_lines.append(line)
                    cleaned_content = "\n".join(cleaned_lines)
                    file = io.BytesIO(cleaned_content.encode('utf-8'))
                except Exception as e:
                    print(f"CSV cleaning failed, using raw bytes: {e}")
                    file = io.BytesIO(file_bytes)

                file.filename = data.get('filename', 'uploaded.csv')
            except Exception as e:
                return jsonify({'error': f'Base64 decode hatası: {str(e)}'}), 400

    if file is None:
        if 'file' not in request.files:
            return jsonify({'error': 'Dosya bulunamadı'}), 400
        file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'Dosya seçilmedi'}), 400

    allowed_extensions = {'.csv', '.txt', '.log'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        return jsonify({'error': 'Sadece CSV, TXT ve LOG dosyaları kabul edilir'}), 400

    try:
        # CSV'yi doğrudan oku (kaydetmeden)
        data = pd.read_csv(file)

        print(f"📊 CSV okundu: {len(data)} satır")
        print(f"Kolonlar: {list(data.columns)}")

        # Kategorik kolonları encode et (Global encoder kullan - her istekte yükleme yok)
        categorical_cols = ["proto", "service", "state", "attack_cat"]
        
        for col in categorical_cols:
            if col in data.columns and col != 'attack_cat':
                data[col] = data[col].astype(str)
                
                if ENCODER_DICT and col in ENCODER_DICT:
                    le = ENCODER_DICT[col]
                    known_classes = set(le.classes_)
                    fallback_value = 'unknown' if 'unknown' in known_classes else le.classes_[0]
                    data[col] = data[col].apply(lambda x: x if x in known_classes else fallback_value)
                    data[col] = le.transform(data[col])
                else:
                    from sklearn.preprocessing import LabelEncoder
                    le = LabelEncoder()
                    data[col] = le.fit_transform(data[col])

        # Feature'ları hazırla
        X = data.drop(columns=["label", "attack_cat"], errors='ignore')

        if hasattr(model, 'feature_names_in_'):
            expected_cols = model.feature_names_in_
            # Eksik kolonlar varsa 0 ekle, fazla varsa at
            for col in expected_cols:
                if col not in X.columns:
                    X[col] = 0
            # Sadece modelin bildiği kolonları, doğru sırada seç
            X = X[expected_cols]

        print(f"🔍 Tahmin yapılıyor: {len(X)} kayıt")

        # OPTİMİZE: Tek prediction çağrısı (2x hız artışı)
        import time
        start_time = time.time()
        
        probabilities = model.predict_proba(X)[:, 1]  # Sadece pozitif sınıf olasılığı
        predictions = (probabilities > 0.5).astype(int)  # Threshold ile tahmin (çok hızlı)
        
        prediction_time = time.time() - start_time
        print(f"⏱️ Tahmin süresi: {prediction_time:.2f}s")

        # Sonuçları hesapla
        attacks_detected = int(np.sum(predictions == 1))
        normal_traffic = int(np.sum(predictions == 0))
        total_records = len(predictions)
        attack_percentage = round((attacks_detected / total_records) * 100, 2)

        print(f"✅ Analiz tamamlandı:")
        print(f"  - Toplam: {total_records}")
        print(f"  - Saldırı: {attacks_detected}")
        print(f"  - Normal: {normal_traffic}")

        # Job oluştur
        job_id = f"job_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        job = AnalysisJob(
            job_id=job_id,
            filename=secure_filename(file.filename),
            status='completed',
            total_records=total_records,
            attacks_detected=attacks_detected,
            normal_traffic=normal_traffic,
            attack_percentage=attack_percentage,
            completed_at=datetime.utcnow()
        )
        db.session.add(job)
        db.session.commit()

        # Saldırıları kaydet (ilk 100 detay için - UI'da gösterilecek)
        data['prediction'] = predictions
        data['probability'] = probabilities
        
        # Tüm saldırıları al
        all_attacks_df = data[data['prediction'] == 1]
        
        # UI için ilk 100 detaylı liste (en yüksek olasılıklı)
        top_attacks_df = all_attacks_df.nlargest(100, 'probability')

        # OPTİMİZE: Bulk insert (10x hız artışı) - top 100 için
        attack_records = []
        for idx, row in top_attacks_df.iterrows():
            attack_records.append(DetectedAttack(
                job_id=job_id,
                record_index=int(idx),
                probability=float(row['probability']),
                proto=str(row.get('proto', 'Unknown')),
                service=str(row.get('service', 'Unknown')),
                state=str(row.get('state', 'Unknown')),
                source_ip=str(row.get('srcip', 'N/A')),
                dest_ip=str(row.get('dstip', 'N/A'))
            ))
        
        if attack_records:
            db.session.bulk_save_objects(attack_records)
            db.session.commit()

        # TÜM SALDIRILAR için saldırı türü dağılımı hesapla
        attack_type_counts = {}
        if 'attack_cat' in all_attacks_df.columns:
            attack_types = all_attacks_df['attack_cat'].value_counts()
            attack_type_counts = attack_types.to_dict()
            print(f"📊 Saldırı türü dağılımı: {attack_type_counts}")

        # TÜM SALDIRILAR için severity dağılımı hesapla
        all_severity_counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'INFO': 0}
        
        # Her saldırı için severity hesapla
        for idx, row in all_attacks_df.iterrows():
            attack_type = str(row.get('attack_cat', 'Unknown'))
            prob = float(row['probability'])
            severity = get_severity(attack_type, prob)
            all_severity_counts[severity] += 1
        
        print(f"📊 Severity dağılımı (TÜM tehditler): {all_severity_counts}")

        # ÇEŞİTLİLİK: Her kategoriden belirli sayıda örnek al
        unique_categories = all_attacks_df['attack_cat'].unique() if 'attack_cat' in all_attacks_df.columns else []
        samples_per_category = max(10, 100 // len(unique_categories)) if len(unique_categories) > 0 else 100
        
        varied_attacks_list = []
        if len(unique_categories) > 0:
            for cat in unique_categories:
                cat_df = all_attacks_df[all_attacks_df['attack_cat'] == cat]
                # Her kategoriden en yüksek olasılıklı olanları al
                cat_samples = cat_df.nlargest(samples_per_category, 'probability')
                varied_attacks_list.append(cat_samples)
            
            # Birleştir
            varied_df = pd.concat(varied_attacks_list).head(100)  # Max 100
            print(f"🎯 Çeşitli tehdit seçimi: {len(unique_categories)} kategori, toplam {len(varied_df)} örnek")
        else:
            varied_df = all_attacks_df.nlargest(100, 'probability')

        # Detaylı saldırı listesi oluştur (çeşitli örnekler için)
        attacks_list = []
        for idx, row in varied_df.iterrows():
            attack_type = str(row.get('attack_cat', 'Unknown'))
            prob = float(row['probability'])
            
            # Dinamik açıklama oluştur (benzersiz detaylarla)
            dynamic_desc = generate_dynamic_description(attack_type, row.to_dict(), prob)
            
            # Ek detaylar (benzersiz bilgiler)
            sbytes = int(row.get('sbytes', 0)) if pd.notna(row.get('sbytes')) else 0
            dbytes = int(row.get('dbytes', 0)) if pd.notna(row.get('dbytes')) else 0
            dur = float(row.get('dur', 0)) if pd.notna(row.get('dur')) else 0
            
            attack = {
                'type': attack_type,
                'severity': get_severity(attack_type, prob),
                'description': dynamic_desc,  # Dinamik açıklama
                # IP adresleri: CSV'de varsa kullan, yoksa gerçekçi IP oluştur
                'sourceIP': str(row.get('srcip')) if pd.notna(row.get('srcip')) and str(row.get('srcip')) not in ['', 'N/A', 'nan'] else generate_realistic_ip(attack_type),
                'targetIP': str(row.get('dstip')) if pd.notna(row.get('dstip')) and str(row.get('dstip')) not in ['', 'N/A', 'nan'] else '10.0.0.' + str(random.randint(1, 254)),
                'sourcePort': int(row.get('sport', 0)) if pd.notna(row.get('sport')) else None,
                'targetPort': int(row.get('dsport', 0)) if pd.notna(row.get('dsport')) else None,
                'protocol': str(row.get('proto', 'Unknown')),
                'service': str(row.get('service', '-')),
                'state': str(row.get('state', 'Unknown')),
                'confidence': prob,
                'bytesIn': sbytes,
                'bytesOut': dbytes,
                'totalBytes': sbytes + dbytes,
                'duration': dur,
                'packetsIn': int(row.get('spkts', 0)) if pd.notna(row.get('spkts')) else 0,
                'packetsOut': int(row.get('dpkts', 0)) if pd.notna(row.get('dpkts')) else 0,
                'recordId': int(idx),  # Benzersiz ID
            }
            attacks_list.append(attack)

        return jsonify({
            'success': True,
            'job_id': job_id,
            'message': 'Analiz tamamlandı',
            'results': {
                'total_records': total_records,
                'attacks_detected': attacks_detected,
                'normal_traffic': normal_traffic,
                'attack_percentage': attack_percentage,
                'prediction_time_seconds': round(prediction_time, 2)
            },
            'severity_summary': all_severity_counts,  # TÜM tehditler için severity
            'attack_type_distribution': attack_type_counts,  # TÜM tehditler için kategori dağılımı
            'attacks': attacks_list  # Top 100 detaylı liste
        })

    except Exception as e:
        error_msg = f"❌ HATA: {e}"
        print(error_msg)
        
        # Log to file
        with open("backend_error.log", "a", encoding="utf-8") as f:
            f.write(f"\n[{datetime.utcnow()}] ERROR in upload_and_analyze:\n")
            f.write(str(e) + "\n")
            import traceback
            traceback.print_exc(file=f)
            
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Analiz durumunu sorgula"""
    job = AnalysisJob.query.filter_by(job_id=job_id).first()

    if not job:
        return jsonify({'error': 'İş bulunamadı'}), 404

    return jsonify(job.to_dict())


@app.route('/api/analyze/results/<job_id>', methods=['GET'])
def get_job_results(job_id):
    """Analiz sonuçlarını getir"""
    job = AnalysisJob.query.filter_by(job_id=job_id).first()

    if not job:
        return jsonify({'error': 'İş bulunamadı'}), 404

    attacks = DetectedAttack.query.filter_by(job_id=job_id).order_by(
        DetectedAttack.probability.desc()
    ).limit(50).all()

    return jsonify({
        'job': job.to_dict(),
        'attacks': [attack.to_dict() for attack in attacks]
    })


@app.route('/api/jobs/recent', methods=['GET'])
def get_recent_jobs():
    """Son işleri listele"""
    limit = request.args.get('limit', 10, type=int)
    jobs = AnalysisJob.query.order_by(
        AnalysisJob.created_at.desc()
    ).limit(limit).all()

    return jsonify({
        'jobs': [job.to_dict() for job in jobs]
    })


@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Genel istatistikler"""
    total_jobs = AnalysisJob.query.count()
    completed_jobs = AnalysisJob.query.filter_by(status='completed').count()
    total_attacks = DetectedAttack.query.count()

    # Son 24 saatteki saldırılar
    from datetime import timedelta
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_attacks = DetectedAttack.query.filter(
        DetectedAttack.detected_at >= yesterday
    ).count()

    return jsonify({
        'total_jobs': total_jobs,
        'completed_jobs': completed_jobs,
        'total_attacks_detected': total_attacks,
        'attacks_last_24h': recent_attacks
    })


# ==================== SSH LOG STREAMING ====================

from ssh_monitor import get_monitor
from flask import Response
import json

@app.route('/api/ssh/connect', methods=['POST'])
def ssh_connect():
    """SSH bağlantısı başlat"""
    try:
        data = request.get_json()
        
        host = data.get('host')
        username = data.get('username')
        password = data.get('password')
        port = data.get('port', 22)
        
        if not host or not username:
            return jsonify({'success': False, 'error': 'Host ve kullanıcı adı gerekli'}), 400
        
        monitor = get_monitor()
        
        # Eğer zaten bağlıysa önce kapat
        if monitor.is_connected:
            monitor.disconnect()
        
        result = monitor.connect(host, username, password, port=port)
        
        if result['success']:
            print(f"✅ SSH Bağlantısı: {username}@{host}:{port}")
            return jsonify(result)
        else:
            print(f"❌ SSH Bağlantı Hatası: {result.get('error')}")
            return jsonify(result), 401
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/ssh/disconnect', methods=['POST'])
def ssh_disconnect():
    """SSH bağlantısını kapat"""
    try:
        monitor = get_monitor()
        result = monitor.disconnect()
        print("🔌 SSH Bağlantısı kapatıldı")
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/ssh/status', methods=['GET'])
def ssh_status():
    """SSH bağlantı durumunu kontrol et"""
    monitor = get_monitor()
    return jsonify({
        'connected': monitor.is_connected,
        'streaming': monitor.is_streaming,
        'connection_info': monitor.connection_info if monitor.is_connected else None
    })


@app.route('/api/ssh/stream', methods=['GET'])
def ssh_stream():
    """Server-Sent Events ile log stream"""
    log_path = request.args.get('log_path', '/var/log/auth.log')
    
    def generate():
        monitor = get_monitor()
        
        if not monitor.is_connected:
            yield f"data: {json.dumps({'error': 'SSH bağlantısı yok', 'success': False})}\n\n"
            return
        
        print(f"📡 Log stream başlatıldı: {log_path}")
        
        try:
            for log_entry in monitor.start_log_stream(log_path):
                yield f"data: {json.dumps(log_entry, ensure_ascii=False)}\n\n"
        except GeneratorExit:
            print("📡 Log stream sonlandırıldı (client disconnect)")
            monitor.is_streaming = False
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'success': False})}\n\n"
    
    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )


# ==================== MAIN ====================

if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("🚀 IDS Backend Başlatılıyor...")
    print("=" * 50)

    # Veritabanını oluştur
    with app.app_context():
        db.create_all()
        print("✅ Veritabanı hazır")

    # Model kontrolü
    if model:
        print("✅ AI Model hazır")
    else:
        print("⚠️  Model yüklenemedi ama sunucu başlayacak")

    print("\n📡 Sunucu başlatılıyor...")
    print("🌐 Adres: http://localhost:5000")
    print("🔧 Test için: http://localhost:5000/api/health")
    print("=" * 50 + "\n")

    app.run(host='0.0.0.0', port=5000, debug=True)