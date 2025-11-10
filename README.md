# LogIz - AI-Powered Log Analysis Platform

Güvenlik log dosyalarınızı yapay zeka ile analiz eden, siber güvenlik tehditleri tespit eden modern web platformu.

## 🚀 Özellikler

- ✅ **Kullanıcı Kimlik Doğrulama**: NextAuth.js ile güvenli giriş/kayıt sistemi
- ✅ **Log Dosyası Yükleme**: Drag & drop ile kolay dosya yükleme
- ✅ **AI-Powered Analiz**: Python modeli ile akıllı tehdit tespiti
- ✅ **Dashboard**: Gerçek zamanlı istatistikler ve tehdit görselleştirme
- ✅ **Analiz Geçmişi**: Tüm analizlerinizi görüntüleme ve filtreleme
- ✅ **Modern UI**: Cyber security temalı dark mode arayüz

## 📋 Gereksinimler

- Node.js 18+ 
- PostgreSQL (Supabase)
- Python 3.8+ (AI model için)

## 🛠️ Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Veritabanı Kurulumu

**ÖNEMLİ**: Veritabanı tablolarını oluşturmak için aşağıdaki adımları takip edin:

#### Supabase SQL Editor'de Tabloları Oluşturun:

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin (tmavagzxznmmwecbudux)
3. Sol menüden "SQL Editor" seçeneğine tıklayın
4. "New Query" butonuna tıklayın
5. `supabase_tables.sql` dosyasındaki SQL kodunu kopyalayıp yapıştırın
6. "Run" butonuna tıklayın

**VEYA**

#### Prisma Migrate ile Oluşturun (Önerilen):

```bash
npx prisma generate
npx prisma db push
```

### 3. Veritabanını Kontrol Edin

Supabase Dashboard > Table Editor'de aşağıdaki tabloların oluştuğunu kontrol edin:
- ✅ User
- ✅ LogFile
- ✅ Analysis
- ✅ Threat
- ✅ ApiKey

### 4. Development Server'ı Başlatın

```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

## 🔑 İlk Kullanıcı Kaydı

1. http://localhost:3000/register adresine gidin
2. Formu doldurun:
   - **Ad Soyad**: İstediğiniz bir ad
   - **Email**: Geçerli bir email adresi
   - **Şifre**: En az 6 karakter
3. "Create Account" butonuna tıklayın
4. Otomatik olarak giriş yapılacak ve dashboard'a yönlendirileceksiniz

## 📱 Sayfa Yapısı

### Kimlik Doğrulama Sayfaları (Herkese Açık)
- `/` - Ana sayfa (landing page)
- `/login` - Giriş sayfası
- `/register` - Kayıt sayfası

### Korumalı Sayfalar (Giriş Gerekli)
- `/dashboard` - Ana dashboard (istatistikler ve son tehditler)
- `/upload` - Log dosyası yükleme
- `/history` - Analiz geçmişi

## 🔐 Kimlik Doğrulama Sistemi

### Özellikler:
- ✅ Email/Şifre ile kayıt
- ✅ Güvenli şifre hashleme (bcrypt)
- ✅ JWT tabanlı session yönetimi
- ✅ Otomatik redirect (giriş yapmadan korumalı sayfalara erişim engellenmiş)
- ✅ Sidebar'da kullanıcı bilgileri gösterimi
- ✅ Logout fonksiyonu

### Middleware Koruması:
Aşağıdaki route'lar middleware ile korunmaktadır:
- `/dashboard/*`
- `/upload/*`
- `/history/*`

Giriş yapmadan bu sayfalara erişmeye çalışırsanız otomatik olarak `/login` sayfasına yönlendirilirsiniz.

## 🗄️ Veritabanı Şeması

### User (Kullanıcılar)
- `id`: UUID
- `email`: String (unique)
- `password`: String (hashed)
- `name`: String (optional)
- `role`: Enum (USER, ADMIN, ANALYST)

### LogFile (Log Dosyaları)
- `id`: UUID
- `filename`: String
- `originalName`: String
- `fileSize`: Int
- `status`: Enum (PENDING, PROCESSING, COMPLETED, FAILED)
- `userId`: UUID (foreign key)

### Analysis (Analizler)
- `id`: UUID
- `result`: JSON
- `threatCount`: Int
- `processingTime`: Int
- `logFileId`: UUID (foreign key)

### Threat (Tehditler)
- `id`: UUID
- `type`: String
- `severity`: Enum (INFO, LOW, MEDIUM, HIGH, CRITICAL)
- `description`: String
- `sourceIP`: String
- `analysisId`: UUID (foreign key)

## 🐍 Python API Entegrasyonu

Python modelinizi entegre etmek için:

1. `lib/python-api.ts` dosyasını açın
2. `analyzeLogWithPython` fonksiyonunu kullanın
3. `.env.local` dosyasında `PYTHON_API_URL` ayarlayın

Şu an mock implementasyon aktif (`mockAnalyzeLog` fonksiyonu).

## 🎨 Tema ve Stil

Cyber security temalı dark mode tasarım:
- **Ana Renkler**: 
  - Cyber Blue: #00d4ff
  - Cyber Purple: #8b5cf6
  - Cyber Green: #00ff88
  - Cyber Red: #ff0055
- **Arka Plan**: #050816, #0a0e27
- **Glassmorphism** efektleri
- **Glow** animasyonları

## 📝 Environment Variables

`.env.local` dosyanızda aşağıdaki değişkenlerin tanımlı olduğundan emin olun:

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"

# Python API
PYTHON_API_URL="http://localhost:8000"
PYTHON_API_KEY="your-python-api-key"
```

## 🚨 Sorun Giderme

### Veritabanı Bağlantı Hatası
- Supabase dashboard'da connection string'i kontrol edin
- `DATABASE_URL` ve `DIRECT_URL` doğru mu kontrol edin
- Şifrenizin doğru olduğundan emin olun

### Giriş Yapamıyorum
- Önce kayıt olduğunuzdan emin olun
- Email ve şifrenizi doğru girdiğinizden emin olun
- Veritabanında `User` tablosunun oluştuğunu kontrol edin

### Upload Çalışmıyor
- `public/uploads` klasörünün var olduğundan emin olun
- Dosya boyutunun 50MB'ın altında olduğunu kontrol edin
- Desteklenen format: .log, .txt, .csv, .json

## 📦 Teknoloji Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS 4
- **Auth**: NextAuth.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Icons**: Lucide React
- **File Upload**: react-dropzone
- **Charts**: Recharts

## 👨‍💻 Geliştirme

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint

# Prisma Studio (database GUI)
npx prisma studio
```

## 📄 Lisans

MIT License

---

**Created with ❤️ for Cybersecurity**

