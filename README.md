# 🛡️ LogIz - AI-Powered Cybersecurity Log Analysis Platform

<div align="center">

![LogIz Banner](https://img.shields.io/badge/LogIz-Cybersecurity-00d4ff?style=for-the-badge&logo=shield&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Ağ trafiği loglarını yapay zeka ile analiz eden, siber güvenlik tehditlerini gerçek zamanlı tespit eden modern web platformu.**

[🚀 Hızlı Başlangıç](#-hızlı-başlangıç) • [📖 Dokümantasyon](#-dokümantasyon) • [🎯 Özellikler](#-özellikler) • [📸 Ekran Görüntüleri](#-ekran-görüntüleri)

</div>

---

## 🎯 Özellikler

### ✅ Tamamlanan Özellikler

| Özellik | Açıklama | Teknoloji |
|---------|----------|-----------|
| 🤖 **AI Tehdit Analizi** | UNSW-NB15 veri seti ile eğitilmiş ML modeli | XGBoost, scikit-learn |
| 📊 **Gerçek Zamanlı Dashboard** | Canlı metrikler, grafikler ve tehdit haritası | Recharts, Leaflet |
| 📁 **Log Dosyası Yükleme** | CSV, TXT, LOG formatları desteklenir | Next.js API Routes |
| 🗺️ **Global Tehdit Haritası** | GeoIP ile coğrafi tehdit görselleştirme | react-leaflet, geoip-lite |
| 🔴 **SSH Canlı İzleme** | Uzak sunuculardan gerçek zamanlı log akışı | Paramiko, SSE |
| 🐳 **Docker Log Streaming** | Container loglarını canlı izleme | dockerode |
| 📈 **Tehdit Kategorileri** | UNSW-NB15 tabanlı 10 saldırı kategorisi | - |
| 🔔 **Bildirim Sistemi** | Kritik tehditler için uyarılar | - |
| 🌙 **Karanlık Tema** | Cyberpunk tarzı modern arayüz | Tailwind CSS |

### 🚧 Geliştirilmekte Olan Özellikler

- [ ] Kullanıcı kimlik doğrulama (NextAuth.js)
- [ ] E-posta bildirimleri
- [ ] Raporlama ve PDF export
- [ ] Tehdit istatistikleri API entegrasyonu

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Dashboard │  │ Upload   │  │  Live    │  │    Threats       │ │
│  │  Page    │  │  Page    │  │ Monitor  │  │     Page         │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       │             │             │                  │           │
│       └─────────────┴─────────────┴──────────────────┘           │
│                              │                                    │
│                    ┌─────────▼─────────┐                         │
│                    │   API Routes      │                         │
│                    │ (Next.js Proxy)   │                         │
│                    └─────────┬─────────┘                         │
└──────────────────────────────┼───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                      BACKEND (Python Flask)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   ML Model   │  │  SSH Monitor │  │   GeoIP Lookup       │   │
│  │  (XGBoost)   │  │  (Paramiko)  │  │   (geoip-lite)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                              │                                    │
│                    ┌─────────▼─────────┐                         │
│                    │     SQLite DB     │                         │
│                    └───────────────────┘                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- Python 3.10+
- Git

### Kurulum

```bash
# 1. Repoyu klonla
git clone https://github.com/YunusEmreksglu/LogIz.git
cd LogIz

# 2. Node bağımlılıklarını yükle
npm install

# 3. Python bağımlılıklarını yükle
pip install -r requirements.txt

# 4. Veritabanını hazırla
npx prisma generate
npx prisma db push

# 5. Uygulamayı başlat
# Terminal 1: Next.js
npm run dev

# Terminal 2: Python API
python app.py
```

### Ortam Değişkenleri (.env)

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth (opsiyonel)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📖 Dokümantasyon

### API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/analyze/upload` | POST | Log dosyası yükle ve analiz et |
| `/api/stats` | GET | Dashboard istatistikleri |
| `/api/threats` | GET | Tehdit listesi |
| `/api/categories/stats` | GET | Kategori dağılımı |
| `/api/traffic/trend` | GET | Trafik trendi |
| `/api/ssh/connect` | POST | SSH bağlantısı başlat |
| `/api/ssh/stream` | GET | SSE log akışı |
| `/api/live-stream` | GET/POST | Docker log streaming |

### Desteklenen Tehdit Kategorileri

| Kategori | Risk Seviyesi | Açıklama |
|----------|---------------|----------|
| Exploits | 🔴 Kritik | Sistem açıkları istismarı |
| DoS | 🔴 Kritik | Hizmet engelleme saldırıları |
| Backdoor | 🔴 Kritik | Arka kapı erişim girişimleri |
| Shellcode | 🔴 Kritik | Zararlı kod enjeksiyonu |
| Worms | 🔴 Kritik | Kendi kendini çoğaltan zararlı |
| Reconnaissance | 🟠 Yüksek | Ağ tarama ve keşif |
| Generic | 🟡 Orta | Genel saldırı kalıpları |
| Fuzzers | 🟡 Orta | Fuzzing saldırı girişimleri |
| Analysis | 🔵 Düşük | Trafik analiz saldırıları |
| Normal | 🟢 Güvenli | Meşru ağ trafiği |

---

## 📸 Ekran Görüntüleri

### Dashboard
Modern ve karanlık temalı ana kontrol paneli.

### Tehdit Analizi
AI destekli otomatik tehdit tespiti ve sınıflandırma.

### Global Tehdit Haritası
Dünya haritası üzerinde coğrafi tehdit kaynakları.

### SSH Canlı İzleme
Uzak sunuculardan gerçek zamanlı log akışı.

---

## 🛠️ Teknoloji Yığını

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Maps:** React-Leaflet
- **Animations:** Framer Motion
- **Icons:** Lucide React

### Backend
- **API:** Python Flask
- **ML Model:** XGBoost (UNSW-NB15 eğitimli)
- **SSH:** Paramiko
- **Database:** SQLite + Prisma ORM

### DevOps
- **Containerization:** Docker, Docker Compose
- **Streaming:** Server-Sent Events (SSE)

---

## 📁 Proje Yapısı

```
LogIz/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Dashboard sayfaları
│   │   ├── dashboard/      # Ana dashboard
│   │   ├── live/           # Canlı izleme
│   │   ├── upload/         # Dosya yükleme
│   │   ├── threats/        # Tehdit listesi
│   │   └── categories/     # Kategori analizi
│   └── api/                # API Routes
├── components/             # React bileşenleri
│   ├── dashboard/          # Dashboard bileşenleri
│   └── charts/             # Grafik bileşenleri
├── lib/                    # Utility fonksiyonları
├── prisma/                 # Veritabanı şeması
├── scripts/                # Yardımcı scriptler
├── app.py                  # Python Flask API
├── ssh_monitor.py          # SSH log monitoring
└── ids_model.pkl           # Eğitilmiş ML modeli
```

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'e push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 👤 Geliştirici

**Yunus Emre Keskin**

- GitHub: [@Samet230](https://github.com/Samet230)

---

<div align="center">

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! ⭐**

</div>
