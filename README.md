# LogIz - AI-Powered Log Analysis Platform

Güvenlik log dosyalarınızı yapay zeka ile analiz eden, siber güvenlik tehditleri tespit eden modern web platformu.

## 🚀 Özellikler

*   **Güvenli Giriş**: NextAuth.js ile tam güvenlikli oturum yönetimi.
*   **Kolay Yükleme**: Log dosyalarınızı sürükleyip bırakarak yükleyin.
*   **Canlı İzleme**: Docker konteynerlerinden gelen logları saniyelik takip edin.
*   **AI Analiz**: Python destekli model ile tehditleri otomatik tespit edin.
*   **Modern Arayüz**: Cyberpunk temalı, kullanıcı dostu dashboard.

## 🛠️ Kurulum

1.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

2.  **Veritabanını Hazırlayın:**
    *   Supabase projenizde `docs/supabase_tables.sql` dosyasındaki SQL komutlarını çalıştırın.

3.  **Çevresel Değişkenler (.env):**
    *   `.env` dosyasını oluşturun ve Supabase/NextAuth anahtarlarınızı girin.

4.  **Uygulamayı Başlatın:**
    ```bash
    npm run dev
    ```

## � Canlı Log Akışı (Docker)

Docker konteynerlerinizin loglarını dashboard üzerinde canlı izlemek için:

```bash
npx tsx scripts/docker-streamer.ts
```

## 📄 Lisans

MIT License.
