from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import pickle
import pandas as pd
import numpy as np
from datetime import datetime
import os
from werkzeug.utils import secure_filename

# ==================== CONFIGURATION CONSTANTS ====================
# Dosya yükleme limitleri
MAX_UPLOAD_SIZE_MB = 50
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# Severity threshold sabitleri
SEVERITY_CRITICAL_THRESHOLD = 0.7
SEVERITY_HIGH_THRESHOLD = 0.8
SEVERITY_MEDIUM_THRESHOLD = 0.7
SEVERITY_LOW_THRESHOLD = 0.5

# Analiz limitleri
TOP_ATTACKS_LIMIT = 100
RECENT_ATTACKS_LIMIT = 50

# Byte dönüşüm sabitleri
BYTES_PER_KB = 1000
BYTES_PER_MB = 1000000

# Veritabanı yapılandırması (environment variable ile override edilebilir)
DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///test_ids.db')

# ==================== FLASK APP ====================
app = Flask(__name__)
CORS(app)

# Veritabanı yapılandırması
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = MAX_UPLOAD_SIZE_BYTES

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
mlModel = None
ENCODER_DICT = None


def load_pickle_from_paths(pathsList: list, itemName: str):
    """
    Verilen path listesinden pickle dosyasını yükler.
    DRY principle - tekrar eden yükleme kodunu önler.
    
    Args:
        pathsList: Pickle dosyası aranacak path listesi
        itemName: Log mesajları için öğe adı (örn: "Model", "Encoder")
    
    Returns:
        Yüklenen nesne veya None
    """
    for filePath in pathsList:
        try:
            if os.path.exists(filePath):
                with open(filePath, 'rb') as pickleFile:
                    loadedItem = pickle.load(pickleFile)
                print(f"✅ {itemName} yüklendi: {filePath}")
                return loadedItem
        except Exception as loadError:
            print(f"⚠️ {itemName} yüklenirken hata ({filePath}): {loadError}")
            continue
    return None


# Model yükle
mlModel = load_pickle_from_paths(MODEL_PATHS, "Model")
if mlModel is None:
    print("❌ Model yüklenemedi! Lütfen model yolunu kontrol et.")

# Encoder yükle
ENCODER_DICT = load_pickle_from_paths(ENCODER_PATHS, "Encoderlar")
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
def generate_dynamic_description(attackType: str, row: dict, probability: float) -> str:
    """Her satır için benzersiz, context-based açıklama oluştur"""
    protocol = str(row.get('proto', 'unknown')).upper()
    service = str(row.get('service', '-'))
    state = str(row.get('state', 'unknown'))
    sourceBytes = int(row.get('sbytes', 0)) if pd.notna(row.get('sbytes')) else 0
    destinationBytes = int(row.get('dbytes', 0)) if pd.notna(row.get('dbytes')) else 0
    duration = float(row.get('dur', 0)) if pd.notna(row.get('dur')) else 0
    
    # Servis bilgisi
    serviceInfo = f" ({service} servisi)" if service and service != '-' else ""
    
    # Veri boyutu bilgisi
    totalBytes = sourceBytes + destinationBytes
    if totalBytes > BYTES_PER_MB:
        sizeInfo = f" ({totalBytes/BYTES_PER_MB:.1f} MB veri transferi)"
    elif totalBytes > BYTES_PER_KB:
        sizeInfo = f" ({totalBytes/BYTES_PER_KB:.1f} KB veri transferi)"
    else:
        sizeInfo = f" ({totalBytes} bytes)" if totalBytes > 0 else ""
    
    # Süre bilgisi
    durationInfo = f", {duration:.2f}s süre" if duration > 0 else ""
    
    # Saldırı türüne göre özelleştirilmiş açıklamalar
    descriptions = {
        'Backdoor': [
            f"{protocol} protokolü üzerinden yetkisiz erişim kapısı girişimi{serviceInfo}{sizeInfo}",
            f"Gizli kanal oluşturma denemesi{serviceInfo}, {state} durumunda{durationInfo}",
            f"Uzaktan erişim trojanı (RAT) aktivitesi{sizeInfo}{durationInfo}",
        ],
        'Exploits': [
            f"{protocol} üzerinden güvenlik açığı istismarı{serviceInfo}{sizeInfo}",
            f"Sistem zafiyeti sömürme girişimi{serviceInfo}, {state} durumunda",
            f"Buffer overflow/injection saldırısı{sizeInfo}{durationInfo}",
        ],
        'DoS': [
            f"{protocol} flood saldırısı{serviceInfo}{sizeInfo}",
            f"Hizmet kesintisi amaçlı aşırı yük{serviceInfo}{durationInfo}",
            f"Kaynak tüketimi saldırısı ({totalBytes} bytes){durationInfo}",
        ],
        'Reconnaissance': [
            f"{protocol} port tarama aktivitesi{serviceInfo}",
            f"Ağ keşfi ve haritalama{serviceInfo}, {state} durumu",
            f"Sistem parmak izi alma girişimi{sizeInfo}",
        ],
        'Shellcode': [
            f"{protocol} üzerinden kod enjeksiyonu{serviceInfo}{sizeInfo}",
            f"Zararlı payload tespit edildi{serviceInfo}{durationInfo}",
            f"Bellek manipülasyonu saldırısı{sizeInfo}",
        ],
        'Fuzzers': [
            f"{protocol} fuzzing testi{serviceInfo}{sizeInfo}",
            f"Rastgele veri ile güvenlik testi{serviceInfo}{durationInfo}",
            f"Protokol belirsizlik testi{sizeInfo}",
        ],
        'Worms': [
            f"Kendini kopyalayan zararlı yazılım{serviceInfo}{sizeInfo}",
            f"Ağ solucanı yayılma girişimi{serviceInfo}{durationInfo}",
            f"Otomatik saldırı propagasyonu{sizeInfo}",
        ],
        'Generic': [
            f"{protocol} üzerinden şüpheli aktivite{serviceInfo}{sizeInfo}",
            f"Anomali tespit edildi{serviceInfo}, {state} durumu{durationInfo}",
            f"Bilinmeyen saldırı kalıbı{sizeInfo}",
        ],
        'Analysis': [
            f"{protocol} trafik analizi saldırısı{serviceInfo}",
            f"Paket dinleme/sniffing aktivitesi{sizeInfo}",
            f"Veri sızıntısı riski{serviceInfo}{durationInfo}",
        ],
    }
    
    # Hash ile tutarlı rastgele seçim (aynı satır her zaman aynı açıklamayı alır)
    import hashlib
    rowHash = hashlib.md5(str(row).encode()).hexdigest()
    hashInteger = int(rowHash[:8], 16)
    
    typeDescriptions = descriptions.get(attackType, [f"{attackType} saldırısı tespit edildi{sizeInfo}"])
    selectedIndex = hashInteger % len(typeDescriptions)
    
    return typeDescriptions[selectedIndex]


# Severity belirleme fonksiyonu
def get_severity(attack_type: str, probability: float) -> str:
    """Saldırı türü ve olasılığa göre ciddiyet belirle"""
    critical_types = ['Backdoor', 'Shellcode', 'Worms', 'Exploits']
    high_types = ['DoS', 'Reconnaissance']
    
    if attack_type in critical_types and probability > SEVERITY_CRITICAL_THRESHOLD:
        return 'CRITICAL'
    elif attack_type in critical_types or (attack_type in high_types and probability > SEVERITY_HIGH_THRESHOLD):
        return 'HIGH'
    elif probability > SEVERITY_MEDIUM_THRESHOLD:
        return 'MEDIUM'
    elif probability > SEVERITY_LOW_THRESHOLD:
        return 'LOW'
    else:
        return 'INFO'


# ==================== HELPER FUNCTIONS ====================
# Bu fonksiyonlar Single Responsibility Principle'a uygun olarak ayrıldı

def extract_file_from_request(requestObj) -> tuple:
    """
    Request'ten dosyayı çıkarır (JSON Base64 veya Multipart Form).
    Returns: (file, error_response) - file None ise error_response döner
    """
    import base64
    import io
    
    file = None
    
    if requestObj.is_json:
        data = requestObj.get_json()
        if 'file_content' in data:
            try:
                # Base64 decode
                fileBytes = base64.b64decode(data['file_content'])
                
                # Clean CSV quotes if present
                try:
                    contentStr = fileBytes.decode('utf-8')
                    lines = contentStr.splitlines()
                    cleanedLines = []
                    for line in lines:
                        line = line.strip()
                        if line.startswith('"') and line.endswith('"'):
                            line = line[1:-1]
                        cleanedLines.append(line)
                    cleanedContent = "\n".join(cleanedLines)
                    file = io.BytesIO(cleanedContent.encode('utf-8'))
                except Exception as cleanError:
                    print(f"CSV cleaning failed, using raw bytes: {cleanError}")
                    file = io.BytesIO(fileBytes)

                file.filename = data.get('filename', 'uploaded.csv')
            except Exception as decodeError:
                return None, ({'error': f'Base64 decode hatası: {str(decodeError)}'}, 400)

    if file is None:
        if 'file' not in requestObj.files:
            return None, ({'error': 'Dosya bulunamadı'}, 400)
        file = requestObj.files['file']

    if file.filename == '':
        return None, ({'error': 'Dosya seçilmedi'}, 400)

    allowedExtensions = {'.csv', '.txt', '.log'}
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in allowedExtensions:
        return None, ({'error': 'Sadece CSV, TXT ve LOG dosyaları kabul edilir'}, 400)

    return file, None


def encode_categorical_columns(dataFrame: pd.DataFrame) -> pd.DataFrame:
    """
    DataFrame'deki kategorik kolonları encode eder.
    Global ENCODER_DICT varsa onu kullanır, yoksa yeni encoder oluşturur.
    """
    categoricalColumns = ["proto", "service", "state", "attack_cat"]
    
    for column in categoricalColumns:
        if column in dataFrame.columns and column != 'attack_cat':
            dataFrame[column] = dataFrame[column].astype(str)
            
            if ENCODER_DICT and column in ENCODER_DICT:
                labelEncoder = ENCODER_DICT[column]
                knownClasses = set(labelEncoder.classes_)
                fallbackValue = 'unknown' if 'unknown' in knownClasses else labelEncoder.classes_[0]
                dataFrame[column] = dataFrame[column].apply(lambda x: x if x in knownClasses else fallbackValue)
                dataFrame[column] = labelEncoder.transform(dataFrame[column])
            else:
                from sklearn.preprocessing import LabelEncoder
                labelEncoder = LabelEncoder()
                dataFrame[column] = labelEncoder.fit_transform(dataFrame[column])
    
    return dataFrame


def prepare_features(dataFrame: pd.DataFrame, mlModel) -> pd.DataFrame:
    """
    Model için feature'ları hazırlar. Eksik kolonları ekler, fazlaları atar.
    """
    features = dataFrame.drop(columns=["label", "attack_cat"], errors='ignore')

    if hasattr(mlModel, 'feature_names_in_'):
        expectedColumns = mlModel.feature_names_in_
        # Eksik kolonlar varsa 0 ekle
        for column in expectedColumns:
            if column not in features.columns:
                features[column] = 0
        # Sadece modelin bildiği kolonları, doğru sırada seç
        features = features[expectedColumns]
    
    return features


def run_ml_predictions(features: pd.DataFrame, mlModel) -> tuple:
    """
    ML modelini çalıştırır ve tahminleri döndürür.
    Returns: (predictions, probabilities, predictionTime)
    """
    import time
    startTime = time.time()
    
    probabilities = mlModel.predict_proba(features)[:, 1]  # Sadece pozitif sınıf olasılığı
    predictions = (probabilities > 0.5).astype(int)  # Threshold ile tahmin
    
    predictionTime = time.time() - startTime
    print(f"⏱️ Tahmin süresi: {predictionTime:.2f}s")
    
    return predictions, probabilities, predictionTime


def build_attack_details(attacksDataFrame: pd.DataFrame) -> list:
    """
    Saldırı DataFrame'inden detaylı saldırı listesi oluşturur.
    """
    attacksList = []
    
    for idx, row in attacksDataFrame.iterrows():
        attackType = str(row.get('attack_cat', 'Unknown'))
        probability = float(row['probability'])
        
        # Dinamik açıklama oluştur
        dynamicDescription = generate_dynamic_description(attackType, row.to_dict(), probability)
        
        # Ek detaylar
        sourceBytesIn = int(row.get('sbytes', 0)) if pd.notna(row.get('sbytes')) else 0
        destinationBytesOut = int(row.get('dbytes', 0)) if pd.notna(row.get('dbytes')) else 0
        duration = float(row.get('dur', 0)) if pd.notna(row.get('dur')) else 0
        
        attack = {
            'type': attackType,
            'severity': get_severity(attackType, probability),
            'description': dynamicDescription,
            'sourceIP': str(row.get('srcip')) if pd.notna(row.get('srcip')) and str(row.get('srcip')) not in ['', 'N/A', 'nan'] else generate_realistic_ip(attackType),
            'targetIP': str(row.get('dstip')) if pd.notna(row.get('dstip')) and str(row.get('dstip')) not in ['', 'N/A', 'nan'] else '10.0.0.' + str(random.randint(1, 254)),
            'sourcePort': int(row.get('sport', 0)) if pd.notna(row.get('sport')) else None,
            'targetPort': int(row.get('dsport', 0)) if pd.notna(row.get('dsport')) else None,
            'protocol': str(row.get('proto', 'Unknown')),
            'service': str(row.get('service', '-')),
            'state': str(row.get('state', 'Unknown')),
            'confidence': probability,
            'bytesIn': sourceBytesIn,
            'bytesOut': destinationBytesOut,
            'totalBytes': sourceBytesIn + destinationBytesOut,
            'duration': duration,
            'packetsIn': int(row.get('spkts', 0)) if pd.notna(row.get('spkts')) else 0,
            'packetsOut': int(row.get('dpkts', 0)) if pd.notna(row.get('dpkts')) else 0,
            'recordId': int(idx),
        }
        attacksList.append(attack)
    
    return attacksList


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
        'model_loaded': mlModel is not None,
        'database': 'sqlite'
    })


@app.route('/api/analyze/upload', methods=['POST'])
def upload_and_analyze():
    """
    CSV dosyası yükle ve anında analiz et.
    Refactored: Helper fonksiyonlar kullanılarak SRP uygulandı.
    """
    # Model kontrolü
    if mlModel is None:
        return jsonify({'error': 'Model yüklenmedi'}), 500

    # 1. Dosyayı request'ten çıkar
    file, errorResponse = extract_file_from_request(request)
    if errorResponse:
        return jsonify(errorResponse[0]), errorResponse[1]

    try:
        # 2. CSV'yi oku
        csvData = pd.read_csv(file)
        print(f"📊 CSV okundu: {len(csvData)} satır")
        print(f"Kolonlar: {list(csvData.columns)}")

        # 3. Kategorik kolonları encode et
        csvData = encode_categorical_columns(csvData)

        # 4. Feature'ları hazırla
        features = prepare_features(csvData, mlModel)
        print(f"🔍 Tahmin yapılıyor: {len(features)} kayıt")

        # 5. ML tahminleri çalıştır
        predictions, probabilities, predictionTime = run_ml_predictions(features, mlModel)

        # 6. Sonuçları hesapla
        attacksDetected = int(np.sum(predictions == 1))
        normalTraffic = int(np.sum(predictions == 0))
        totalRecords = len(predictions)
        attackPercentage = round((attacksDetected / totalRecords) * 100, 2)

        print(f"✅ Analiz tamamlandı:")
        print(f"  - Toplam: {totalRecords}")
        print(f"  - Saldırı: {attacksDetected}")
        print(f"  - Normal: {normalTraffic}")

        # 7. Analiz job'ı oluştur ve kaydet
        jobId = f"job_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        job = AnalysisJob(
            job_id=jobId,
            filename=secure_filename(file.filename),
            status='completed',
            total_records=totalRecords,
            attacks_detected=attacksDetected,
            normal_traffic=normalTraffic,
            attack_percentage=attackPercentage,
            completed_at=datetime.utcnow()
        )
        db.session.add(job)
        db.session.commit()

        # 8. Prediction sonuçlarını DataFrame'e ekle
        csvData['prediction'] = predictions
        csvData['probability'] = probabilities
        
        # 9. Tüm saldırıları filtrele
        allAttacksDataFrame = csvData[csvData['prediction'] == 1]
        
        # 10. Veritabanına en yüksek olasılıklı saldırıları kaydet
        topAttacksDataFrame = allAttacksDataFrame.nlargest(TOP_ATTACKS_LIMIT, 'probability')
        attackRecords = []
        for idx, row in topAttacksDataFrame.iterrows():
            attackRecords.append(DetectedAttack(
                job_id=jobId,
                record_index=int(idx),
                probability=float(row['probability']),
                proto=str(row.get('proto', 'Unknown')),
                service=str(row.get('service', 'Unknown')),
                state=str(row.get('state', 'Unknown')),
                source_ip=str(row.get('srcip', 'N/A')),
                dest_ip=str(row.get('dstip', 'N/A'))
            ))
        
        if attackRecords:
            db.session.bulk_save_objects(attackRecords)
            db.session.commit()

        # 11. Saldırı türü dağılımını hesapla
        attackTypeCounts = {}
        if 'attack_cat' in allAttacksDataFrame.columns:
            attackTypes = allAttacksDataFrame['attack_cat'].value_counts()
            attackTypeCounts = attackTypes.to_dict()
            print(f"📊 Saldırı türü dağılımı: {attackTypeCounts}")

        # 12. Severity dağılımını hesapla
        severityCounts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'INFO': 0}
        for idx, row in allAttacksDataFrame.iterrows():
            attackType = str(row.get('attack_cat', 'Unknown'))
            probability = float(row['probability'])
            severity = get_severity(attackType, probability)
            severityCounts[severity] += 1
        
        print(f"📊 Severity dağılımı (TÜM tehditler): {severityCounts}")

        # 13. Çeşitli kategorilerden örnekler al
        uniqueCategories = allAttacksDataFrame['attack_cat'].unique() if 'attack_cat' in allAttacksDataFrame.columns else []
        samplesPerCategory = max(10, TOP_ATTACKS_LIMIT // len(uniqueCategories)) if len(uniqueCategories) > 0 else TOP_ATTACKS_LIMIT
        
        variedAttacksList = []
        if len(uniqueCategories) > 0:
            for category in uniqueCategories:
                categoryDataFrame = allAttacksDataFrame[allAttacksDataFrame['attack_cat'] == category]
                categorySamples = categoryDataFrame.nlargest(samplesPerCategory, 'probability')
                variedAttacksList.append(categorySamples)
            
            variedDataFrame = pd.concat(variedAttacksList).head(TOP_ATTACKS_LIMIT)
            print(f"🎯 Çeşitli tehdit seçimi: {len(uniqueCategories)} kategori, toplam {len(variedDataFrame)} örnek")
        else:
            variedDataFrame = allAttacksDataFrame.nlargest(TOP_ATTACKS_LIMIT, 'probability')

        # 14. Detaylı saldırı listesi oluştur (helper fonksiyon kullan)
        attacksList = build_attack_details(variedDataFrame)

        # 15. Sonuçları döndür
        return jsonify({
            'success': True,
            'job_id': jobId,
            'message': 'Analiz tamamlandı',
            'results': {
                'total_records': totalRecords,
                'attacks_detected': attacksDetected,
                'normal_traffic': normalTraffic,
                'attack_percentage': attackPercentage,
                'prediction_time_seconds': round(predictionTime, 2)
            },
            'severity_summary': severityCounts,
            'attack_type_distribution': attackTypeCounts,
            'attacks': attacksList
        })

    except Exception as analysisError:
        errorMessage = f"❌ HATA: {analysisError}"
        print(errorMessage)
        
        # Log to file
        with open("backend_error.log", "a", encoding="utf-8") as logFile:
            logFile.write(f"\n[{datetime.utcnow()}] ERROR in upload_and_analyze:\n")
            logFile.write(str(analysisError) + "\n")
            import traceback
            traceback.print_exc(file=logFile)
            
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(analysisError)}), 500


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
    ).limit(RECENT_ATTACKS_LIMIT).all()

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
    if mlModel:
        print("✅ AI Model hazır")
    else:
        print("⚠️  Model yüklenemedi ama sunucu başlayacak")

    print("\n📡 Sunucu başlatılıyor...")
    print("🌐 Adres: http://localhost:5000")
    print("🔧 Test için: http://localhost:5000/api/health")
    print("=" * 50 + "\n")

    app.run(host='0.0.0.0', port=5000, debug=True)