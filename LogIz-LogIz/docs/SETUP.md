# 🚀 LogIz - Hızlı Kurulum Rehberi

## 📋 Ön Gereksinimler

- ✅ Node.js 18+ 
- ✅ Supabase Hesabı

---

## 🎯 Hızlı Başlangıç

### 1️⃣ Bağımlılıkları Yükleyin
```powershell
npm install
```

### 2️⃣ Veritabanı Yapılandırması (Supabase)

Projeniz Supabase ile çalışacak şekilde yapılandırılmıştır.

1. `.env` dosyasını açın.
2. Supabase panelinden aldığınız bağlantı bilgilerini ekleyin:

```env
DATABASE_URL="postgresql://postgres.[project]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[project]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

### 3️⃣ Prisma'yı Başlatın
```powershell
npx prisma generate
npx prisma db push
```

### 4️⃣ Uygulamayı Çalıştırın
```powershell
npm run dev
```

✅ **Hazır!** http://localhost:3000 adresine gidin

---

## 🐍 Python API Kurulumu (Opsiyonel)

### 1️⃣ Python paketlerini yükleyin
```powershell
pip install -r requirements.txt
```

### 2️⃣ Mock API'yi başlatın
```powershell
python python_api.py
```

API şu adreste çalışacak: http://localhost:8000

### 3️⃣ Next.js'i Python API kullanacak şekilde ayarlayın

`lib/python-api.ts` dosyasını açın ve şunu değiştirin:

```typescript
// Upload component'inde bu satırı bulun:
const analysisResult = await mockAnalyzeLog({...})

// Bununla değiştirin:
const analysisResult = await analyzeLogWithPython({...})
```

`.env.local` dosyasına ekleyin:
```env
PYTHON_API_URL="http://localhost:8000"
```

---

## 🧪 Test Etme

### 1. Örnek log dosyası yükleyin
Proje klasöründe `sample_log.txt` dosyası var. Bunu test için kullanabilirsiniz:

1. http://localhost:3000/upload sayfasına gidin
2. `sample_log.txt` dosyasını sürükleyin
3. "Analyze Log File" butonuna tıklayın
4. Sonuçları görüntüleyin!

### 2. API'yi test edin
```powershell
# Health check
curl http://localhost:3000/api/stats

# Python API health
curl http://localhost:8000/health
```

---

## 📊 Veritabanı Yönetimi

### Prisma Studio ile GUI
```powershell
npx prisma studio
```
http://localhost:5555 adresinde açılır

### Veritabanını sıfırlama
```powershell
npx prisma db push --force-reset
```

### Migration oluşturma
```powershell
npx prisma migrate dev --name init
```

---

## 🔧 Yaygın Sorunlar ve Çözümler



### ❌ "Module not found" hatası
```powershell
# Temiz kurulum
rm -rf node_modules package-lock.json
npm install
```

### ❌ Upload çalışmıyor
```powershell
# uploads klasörünün var olduğundan emin olun
mkdir public\uploads -Force
```

### ❌ Python API bağlanmıyor
```powershell
# Flask'ın çalıştığını kontrol edin
curl http://localhost:8000/health

# CORS sorunu varsa flask-cors yükleyin
pip install flask-cors
```

---

## 🎨 Proje Yapısı

```
logiz/
├── 📱 app/
│   ├── 🏠 page.tsx              # Landing page
│   ├── 📊 dashboard/            # Dashboard
│   ├── 📤 upload/               # Upload sayfası
│   ├── 📜 history/              # History sayfası
│   └── 🔌 api/                  # API endpoints
│       ├── upload/
│       ├── analyze/
│       ├── logs/
│       └── stats/
├── 🧩 components/               # React components
├── 📚 lib/                      # Utilities
├── 🗄️ prisma/                   # Database schema
├── 🐍 python_api.py             # Mock Python API
└── 📦 sample_log.txt            # Test dosyası
```

---

## 🚀 Production'a Deployment

### Vercel'e Deploy
```powershell
# Vercel CLI yükleyin
npm i -g vercel

# Deploy edin
vercel

# Environment variables'ı Vercel dashboard'dan ayarlayın
```

### Docker ile (gelişmiş)
```dockerfile
# Dockerfile oluşturun
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📝 Sonraki Adımlar

1. ✅ Uygulamayı test edin
2. 🤖 Kendi AI modelinizi entegre edin
3. 👥 Authentication ekleyin (NextAuth.js)
4. 📧 Email notifications
5. 📊 Daha fazla görselleştirme
6. 🔒 API rate limiting
7. 📱 Mobile responsive iyileştirmeler

---

## 💡 Yardım

Sorun mu yaşıyorsunuz? 

1. 📖 README.md dosyasını okuyun
2. 🔍 GitHub Issues'a bakın
3. 📧 Destek isteyin

---

**Keyifli kodlamalar!** 🎉
