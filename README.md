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

## 🐳 Canlı Log Akışı (Docker)

Docker konteynerlerinizin loglarını dashboard üzerinde canlı izlemek için:

```bash
npx tsx scripts/docker-streamer.ts
```

## 📄 Lisans

MIT License.

## 🔄 Sürüm v1.2 Güncellemeleri (LogIz Branch)

Bu sürümde, log analizi sonuçlarının görselleştirilmesi ve veri akışında önemli iyileştirmeler yapılmıştır:

*   **Gerçek Veri Entegrasyonu**: Dashboard, Kategoriler ve Saldırı Türleri sayfaları artık mock veriler yerine Supabase veritabanından gelen gerçek analiz sonuçlarını kullanıyor.
*   **Kapsamlı Grafikler**: Kategori ve Saldırı Türü grafiklerindeki "ilk 6" sınırlaması kaldırıldı. Artık tespit edilen *tüm* saldırı türleri (Backdoor, Shellcode, Worms vb.) grafiklerde görüntüleniyor.
*   **Trafik ve Tehdit Zaman Çizelgeleri**: 
    *   `Traffic Trend` grafiği artık yüklenen log dosyalarının boyutuna göre gerçek yükleme trafiğini simüle ediyor.
    *   `Threats Over Time` grafiği gerçek analiz zaman damgalarını kullanıyor.
*   **Doğru İstatistikler**:
    *   History sayfasındaki Kritik/Yüksek/Orta seviye sayıları artık `analyses.result` içindeki tam özetten çekiliyor, bu sayede büyük tehdit sayılarında dahi (örn. 100k+) doğru sınıflandırma gösteriliyor.
    *   Dashboard ve detay sayfalarındaki toplam tehdit sayıları tutarlı hale getirildi (Normal trafik hariç tutularak).
*   **AI Model İyileştirmeleri**: Random Forest ve XGBoost model karşılaştırmaları yapıldı ve veri seti UNSW-NB15 yapısına uygun hale getirildi.
