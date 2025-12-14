# 🚀 Supabase Kurulum Rehberi

## Adım 1: Supabase Projesi Oluşturun

1. **Supabase hesabı açın:** https://supabase.com
2. **"New Project" butonuna tıklayın**
3. **Proje bilgilerini doldurun:**
   - Name: `logiz-db` (veya istediğiniz isim)
   - Database Password: Güçlü bir şifre belirleyin (kaydedin!)
   - Region: En yakın bölgeyi seçin (örn: Europe (Frankfurt))
   - Pricing Plan: Free tier başlangıç için yeterli

4. **"Create new project" butonuna tıklayın**
   - Proje oluşturulması 2-3 dakika sürebilir

---

## Adım 2: Database Connection String'lerini Alın

### 📋 Connection Pooling (Önerilen - Production için)

1. Supabase dashboard'da sol menüden **"Project Settings"** (⚙️ ikonu) tıklayın
2. **"Database"** sekmesine gidin
3. **"Connection string"** bölümünü bulun
4. **"Connection Pooling"** modunu seçin
5. **URI** formatını seçin
6. Connection string'i kopyalayın (şöyle görünecek):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### 📋 Direct Connection (Migration için gerekli)

1. Aynı **"Connection string"** bölümünde
2. **"Session mode"** seçin
3. Connection string'i kopyalayın (şöyle görünecek):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```

---

## Adım 3: .env.local Dosyasını Güncelleyin

`.env.local` dosyasını açın ve şunları yapıştırın:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"

# Python AI Model API
PYTHON_API_URL="http://localhost:8000"
PYTHON_API_KEY="your-python-api-key"

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR="./public/uploads"
```

⚠️ **ÖNEMLİ:** 
- `[PROJECT-REF]` kısmını kendi project ref'inizle değiştirin
- `[YOUR-PASSWORD]` kısmını Supabase şifrenizle değiştirin

---

## Adım 4: Prisma Migration'ları Çalıştırın

```powershell
# Prisma client'ı yeniden oluşturun
npx prisma generate

# Veritabanı tablolarını oluşturun
npx prisma db push
```

✅ Başarılı olursa şöyle bir çıktı göreceksiniz:
```
Your database is now in sync with your Prisma schema. Done in 1.5s
✔ Generated Prisma Client
```

---

## Adım 5: Veritabanını Kontrol Edin

### Seçenek A: Prisma Studio (Yerel GUI)
```powershell
npx prisma studio
```
http://localhost:5555 adresinde açılır

### Seçenek B: Supabase Table Editor
1. Supabase dashboard'da **"Table Editor"** sekmesine gidin
2. Oluşturulan tabloları görmelisiniz:
   - users
   - log_files
   - analyses
   - threats
   - api_keys

---

## Adım 6: Uygulamayı Başlatın

```powershell
npm run dev
```

Artık Supabase'e bağlısınız! 🎉

---

## 🔍 Sorun Giderme

### ❌ "Can't reach database server"
```powershell
# .env.local dosyasını kontrol edin
# Connection string'in doğru olduğundan emin olun
# Şifrede özel karakterler varsa URL encode edin
```

### ❌ "P1001: Can't connect to database"
- Supabase projesinin açık olduğundan emin olun
- Internet bağlantınızı kontrol edin
- Supabase dashboard'dan projenin durumunu kontrol edin

### ❌ "Database password is incorrect"
- Supabase şifrenizi doğru kopyaladığınızdan emin olun
- Şifrede özel karakterler varsa URL encode etmeniz gerekebilir:
  - `@` → `%40`
  - `#` → `%23`
  - `&` → `%26`

### 🔄 Şifreyi Sıfırlama
1. Supabase dashboard > Project Settings > Database
2. "Reset database password" butonuna tıklayın
3. Yeni şifreyi `.env.local`'e yapıştırın

---

## 📊 Supabase Dashboard Özellikleri

### Table Editor
- Verileri görsel olarak görüntüleyin ve düzenleyin
- SQL sorguları çalıştırın

### SQL Editor
- Custom SQL sorguları yazın
- Örnek:
  ```sql
  SELECT * FROM log_files;
  SELECT * FROM threats WHERE severity = 'CRITICAL';
  ```

### Database Backups
- Otomatik günlük backup'lar (Free tier: 7 gün)
- Manuel backup oluşturma

### Logs
- Real-time database logs
- API isteklerini izleme

---

## 🚀 Production Deployment

Vercel'e deploy ederken:

1. Vercel dashboard > Your Project > Settings > Environment Variables
2. Şu değişkenleri ekleyin:
   ```
   DATABASE_URL=your-supabase-connection-pooling-url
   DIRECT_URL=your-supabase-direct-url
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-random-secret
   ```

3. Redeploy edin

---

## 💡 İpuçları

✅ **Connection Pooling kullanın** - Daha iyi performans
✅ **Row Level Security (RLS) ekleyin** - Güvenlik için
✅ **Indexes kullanın** - Sorgu performansı için (zaten schema'da var)
✅ **Backups düzenli kontrol edin**
✅ **Free tier limitlerine dikkat edin:**
   - 500 MB database
   - 2 GB bandwidth
   - 50k database rows (INSERT/UPDATE/DELETE)

---

## 🔗 Faydalı Linkler

- 📚 Supabase Docs: https://supabase.com/docs
- 🔌 Prisma + Supabase: https://supabase.com/docs/guides/integrations/prisma
- 💬 Supabase Discord: https://discord.supabase.com

---

**Hazırsınız! Artık production-ready bir veritabanı kullanıyorsunuz!** 🎉
