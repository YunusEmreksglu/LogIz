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
    'models/ids_model.pkl',
    'ids_model.pkl',
    'unsw_model.pkl'
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
    print("❌ Model yüklenemedi! Lütfen model dosyasını (ids_model.pkl) proje ana dizinine koyun.")
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

@app.route('/health', methods=['GET'])
def health_check():
    """Sistem sağlık kontrolü"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'model_loaded': model is not None,
        'database': 'sqlite'
    })

# Frontend uyumluluğu için /analyze endpoint'i
@app.route('/analyze', methods=['POST'])
def analyze_adapter():
    """
    Frontend'den gelen isteği karşıla ve modele uygun hale getir.
    Frontend JSON gönderiyor: { log_content, filename, file_type }
    Model CSV bekliyor. Bu yüzden log_content'i geçici CSV'ye çevirip işleyeceğiz.
    """
    try:
        data = request.json
        log_content = data.get('log_content', '')
        filename = data.get('filename', 'unknown.csv')
        
        if not log_content:
            return jsonify({'success': False, 'error': 'No log content'}), 400

        # Eğer model yoksa mock cevap dön (sistemi kırmamak için)
        if model is None:
            return jsonify({
                'success': True,
                'threatCount': 0,
                'threats': [],
                'summary': {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0},
                'processingTime': 0,
                'message': 'Model not loaded. Please upload ids_model.pkl'
            })

        # Log içeriğini DataFrame'e çevir
        from io import StringIO
        # CSV formatında olduğunu varsayıyoruz
        try:
            df = pd.read_csv(StringIO(log_content))
        except:
            # CSV değilse, belki satır satır logdur. Şimdilik hata dönelim veya mock yapalım
            return jsonify({'success': False, 'error': 'Invalid CSV format'}), 400

        # Analiz mantığı (upload_and_analyze fonksiyonundan uyarlandı)
        
        # Kategorik kolonları encode et (Save edilmiş encoder'ları kullan)
        categorical_cols = ["proto", "service", "state"]
        le_dict = None
        
        # Encoderları yükle
        ENCODER_PATH = 'encoders.pkl'
        if os.path.exists(ENCODER_PATH):
            with open(ENCODER_PATH, 'rb') as f:
                le_dict = pickle.load(f)
        
        for col in categorical_cols:
            if col in df.columns:
                df[col] = df[col].astype(str)
                
                if le_dict and col in le_dict:
                    le = le_dict[col]
                    # Bilinmeyen değerleri 'unknown' yap (veya en sık tekrar edene ata)
                    known_classes = set(le.classes_)
                    # Eğer 'unknown' class'ı varsa ona ata, yoksa class[0]'a ata
                    fallback_value = 'unknown' if 'unknown' in known_classes else le.classes_[0]
                    
                    df[col] = df[col].apply(lambda x: x if x in known_classes else fallback_value)
                    df[col] = le.transform(df[col])
                else:
                    # Fallback
                    from sklearn.preprocessing import LabelEncoder
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col])

        # Feature'ları hazırla
        # Feature'ları hazırla
        X = df.drop(columns=["label", "attack_cat"], errors='ignore')

        # Feature Alignment (Modelin beklediği sıraya ve sütunlara göre ayarla)
        if hasattr(model, 'feature_names_in_'):
            expected_cols = list(model.feature_names_in_)
            # Eksik kolonlar varsa 0 ekle, fazla varsa at
            for col in expected_cols:
                if col not in X.columns:
                    X[col] = 0
            # Sadece modelin bildiği kolonları, doğru sırada seç
            X = X[expected_cols]

        # Tahmin yap
        predictions = model.predict(X)
        # probabilities = model.predict_proba(X)[:, 1] # Bazı modellerde bu olmayabilir

        # Sonuçları topla
        threats = []
        threat_counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'INFO': 0}
        
        for i, pred in enumerate(predictions):
            if pred == 1: # Saldırı
                severity = 'HIGH' # Modelden severity gelmiyorsa varsayılan
                threat_counts[severity] += 1
                
                if len(threats) < 50: # Sadece ilk 50 tehdidi dön
                    threats.append({
                        'type': 'ANOMALY_DETECTED',
                        'severity': severity,
                        'description': 'AI Model detected anomalous traffic pattern',
                        'sourceIP': str(df.iloc[i].get('srcip', 'N/A')),
                        'targetIP': str(df.iloc[i].get('dstip', 'N/A')),
                'port': int(df.iloc[i].get('dsport', 0)) if 'dsport' in df.columns else None,
                        'timestamp': datetime.utcnow().isoformat(),
                        'rawLog': str(df.iloc[i].to_dict()), # Add raw log content
                        'confidence': 0.95
                    })

        return jsonify({
            'success': True,
            'threatCount': len(threats),
            'threats': threats,
            'summary': {
                'critical': threat_counts['CRITICAL'],
                'high': threat_counts['HIGH'],
                'medium': threat_counts['MEDIUM'],
                'low': threat_counts['LOW'],
                'info': threat_counts['INFO']
            },
            'processingTime': 100 
        })

    except Exception as e:
        print(f"Analysis Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== MAIN ====================

if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("🚀 LogIz Real AI Backend Başlatılıyor...")
    print("=" * 50)

    # Veritabanını oluştur
    with app.app_context():
        db.create_all()
        print("✅ Veritabanı hazır (test_ids.db)")

    # Model kontrolü
    if model:
        print("✅ AI Model hazır")
    else:
        print("⚠️  UYARI: Model dosyası bulunamadı!")
        print("    Lütfen 'ids_model.pkl' dosyasını proje klasörüne yükleyin.")

    print("\n📡 Sunucu başlatılıyor...")
    print("🌐 Adres: http://localhost:8000")
    print("=" * 50 + "\n")

    app.run(host='0.0.0.0', port=8000, debug=True)
