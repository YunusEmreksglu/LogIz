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

model = None
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
    print("Denenen yollar:")
    for path in MODEL_PATHS:
        print(f"  - {path} (Var mı: {os.path.exists(path)})")


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

        # Kategorik kolonları encode et (Save edilmiş encoder'ları kullan)
        categorical_cols = ["proto", "service", "state", "attack_cat"]
        le_dict = None
        
        # Encoderları yükle
        ENCODER_PATH = 'encoders.pkl'
        if os.path.exists(ENCODER_PATH):
            with open(ENCODER_PATH, 'rb') as f:
                le_dict = pickle.load(f)
                print("✅ Encoderlar yüklendi")
        
        for col in categorical_cols:
            if col in data.columns and col != 'attack_cat': # attack_cat label, feature değil
                data[col] = data[col].astype(str)
                
                if le_dict and col in le_dict:
                    le = le_dict[col]
                    # Bilinmeyen değerleri 'unknown' yap (veya en sık tekrar edene ata)
                    known_classes = set(le.classes_)
                    # Eğer 'unknown' class'ı varsa ona ata, yoksa class[0]'a ata
                    fallback_value = 'unknown' if 'unknown' in known_classes else le.classes_[0]
                    
                    data[col] = data[col].apply(lambda x: x if x in known_classes else fallback_value)
                    data[col] = le.transform(data[col])
                    print(f"✓ {col} encoded with saved encoder")
                else:
                    # Fallback: Eğer encoder yoksa yenisini oluştur (Eski yöntem - Riskli)
                    from sklearn.preprocessing import LabelEncoder
                    le = LabelEncoder()
                    data[col] = le.fit_transform(data[col])
                    print(f"⚠️ {col} encoded with NEW encoder (saved encoder not found)")

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

        # Tahmin yap
        predictions = model.predict(X)
        probabilities = model.predict_proba(X)[:, 1]

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

        # Saldırıları kaydet (ilk 50)
        data['prediction'] = predictions
        data['probability'] = probabilities
        attacks_df = data[data['prediction'] == 1].nlargest(50, 'probability')

        for idx, row in attacks_df.iterrows():
            attack = DetectedAttack(
                job_id=job_id,
                record_index=int(idx),
                probability=float(row['probability']),
                proto=str(row.get('proto', 'Unknown')),
                service=str(row.get('service', 'Unknown')),
                state=str(row.get('state', 'Unknown')),
                source_ip=str(row.get('srcip', 'N/A')),
                dest_ip=str(row.get('dstip', 'N/A'))
            )
            db.session.add(attack)

        db.session.commit()

        # Saldırıları listeye çevir
        attacks_list = []
        for idx, row in attacks_df.iterrows():
            attack = {
                'type': row.get('attack_cat', 'Attack'),
                'severity': 'HIGH' if row['probability'] > 0.8 else 'MEDIUM',
                'description': f"Detected {row.get('attack_cat', 'attack')} traffic",
                'sourceIP': str(row.get('srcip', 'N/A')),
                'targetIP': str(row.get('dstip', 'N/A')),
                'port': int(row.get('dsport', 0)) if pd.notna(row.get('dsport')) else None,
                'confidence': float(row['probability']),
                'rawLog': str(row.to_dict())
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
                'attack_percentage': attack_percentage
            },
            'attacks': attacks_list  # Frontend için gerekli
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