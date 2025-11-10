# UNSW-NB15 Dataset ile Python API Çalıştırma Rehberi

## 🎯 Gereksinimler

```bash
pip install flask flask-cors pandas numpy scikit-learn
```

## 🚀 Çalıştırma

### 1. Python API'yi Başlatın

```bash
cd C:\Users\asus\Desktop\logiz
python python_ml_model.py
```

API http://localhost:8000 adresinde başlayacak.

### 2. API Test Edin

Tarayıcıdan şu adreslere gidin:
- **Health Check**: http://localhost:8000/health
- **Dataset Stats**: http://localhost:8000/dataset/stats

## 📊 API Endpoints

### POST /analyze
Log dosyasını analiz eder ve UNSW-NB15 veri seti ile karşılaştırır.

**Request:**
```json
{
  "log_content": "log file content",
  "filename": "access.log"
}
```

**Response:**
```json
{
  "status": "success",
  "filename": "access.log",
  "threats": [
    {
      "type": "DOS_ATTACK",
      "severity": "CRITICAL",
      "description": "DoS attack detected from dataset pattern",
      "sourceIP": "192.168.1.100",
      "targetIP": "10.0.0.1",
      "port": 80,
      "confidence": 0.85,
      "timestamp": "2025-11-10T19:45:00"
    }
  ],
  "threat_count": 5,
  "severity_counts": {
    "critical": 2,
    "high": 1,
    "medium": 1,
    "low": 1,
    "info": 0
  }
}
```

### GET /health
API durumunu ve veri seti bilgilerini döndürür.

**Response:**
```json
{
  "status": "healthy",
  "dataset_loaded": true,
  "model_loaded": false,
  "dataset_size": 175341
}
```

### GET /dataset/stats
UNSW-NB15 veri seti istatistiklerini gösterir.

**Response:**
```json
{
  "total_records": 175341,
  "columns": ["srcip", "dstip", "attack_cat", ...],
  "attack_types": {
    "Normal": 56000,
    "DoS": 16353,
    "Exploits": 44525,
    "Generic": 40000,
    "Reconnaissance": 13987,
    "Backdoor": 2329,
    "Analysis": 2677,
    "Fuzzers": 24246,
    "Worms": 174,
    "Shellcode": 1511
  },
  "normal_traffic": 56000
}
```

## 🔍 Nasıl Çalışır?

1. **Pattern Matching**: Yüklenen log dosyasındaki pattern'leri UNSW-NB15 veri setindeki bilinen saldırı pattern'leri ile karşılaştırır.

2. **Saldırı Tipleri**:
   - **DoS/DDoS**: Denial of Service saldırıları
   - **Exploits**: Yazılım güvenlik açıklarından yararlanma
   - **Reconnaissance**: Port tarama ve keşif aktiviteleri
   - **Backdoor**: Arka kapı tespit edilmesi
   - **Shellcode**: Zararlı kod enjeksiyonu
   - **Fuzzers**: Fuzzing saldırıları
   - **Worms**: Kendi kendini kopyalayan zararlı yazılımlar

3. **Severity Mapping**:
   - `CRITICAL`: DoS, Backdoor, Shellcode, Worms
   - `HIGH`: Exploits, Worms
   - `MEDIUM`: Generic, Fuzzers
   - `LOW`: Reconnaissance, Analysis
   - `INFO`: Normal traffic

## 🎓 Gelişmiş Kullanım

### Kendi Modelinizi Ekleyin

Eğitilmiş bir ML modeliniz varsa (`unsw_model.pkl`):

```python
import pickle
with open('unsw_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Model ile tahmin
predictions = model.predict(features)
```

### Veri Seti Yolunu Değiştirin

`python_ml_model.py` dosyasında:

```python
DATASET_PATH = r'C:\Users\asus\Desktop\VTYSY\unsw-nb15-training-set.csv'
```

## 🐛 Troubleshooting

### Veri Seti Yüklenemedi
- Dosya yolunun doğru olduğunu kontrol edin
- CSV dosyasının okunabilir olduğunu kontrol edin

### Port Kullanımda Hatası
```bash
# Farklı port kullanın
app.run(host='0.0.0.0', port=8001, debug=True)
```

### Pandas/NumPy Hatası
```bash
pip install --upgrade pandas numpy
```

## 📝 Örnek Kullanım

### PowerShell'den Test:

```powershell
$body = @{
    log_content = "192.168.1.100 - - [10/Nov/2025:19:45:00] GET /admin HTTP/1.1 404"
    filename = "test.log"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/analyze" -Method POST -Body $body -ContentType "application/json"
```

### Next.js'ten Kullanım:

Log dosyanızı web arayüzünden yükleyin:
1. http://localhost:3000/upload adresine gidin
2. Log dosyanızı sürükle-bırak ile yükleyin
3. Python API otomatik olarak çağrılır
4. Sonuçları görmek için Dashboard'a gidin

## ✅ Başarılı Kurulum Kontrolü

Python API çalışıyorsa şu çıktıları görmelisiniz:

```
🚀 LogIz ML Model API Starting...
==================================================
📊 UNSW-NB15 veri seti yükleniyor...
✅ Veri seti yüklendi: 175341 kayıt
📋 Kolonlar: ['srcip', 'dstip', 'attack_cat', ...]
==================================================
🌐 Starting Flask server on http://localhost:8000
📊 API Endpoints:
   - POST /analyze       : Log dosyasını analiz et
   - GET  /health        : API durumunu kontrol et
   - GET  /dataset/stats : Veri seti istatistikleri
==================================================
```

## 🎉 Artık Hazırsınız!

Python API çalıştığında, Next.js uygulamanız otomatik olarak gerçek analiz kullanacak ve UNSW-NB15 veri seti ile karşılaştırma yapacaktır!
