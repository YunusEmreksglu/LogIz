import requests
import pandas as pd
import json
import base64

# API URL
API_URL = "http://localhost:8000/analyze"

# Dosya Oku (ilk 1000 satır yeterli test için)
csv_file = "123.csv"
try:
    with open(csv_file, 'r') as f:
        # Tüm dosyayı okuyalım, zaten 175k satır, çok değil (50MB sınırı var)
        log_content = f.read()
    
    print(f"📄 {csv_file} okundu. Boyut: {len(log_content)} bytes")

    # API İsteği Hazırla
    payload = {
        "log_content": log_content,
        "filename": csv_file
    }

    print(f"📡 API'ye gönderiliyor: {API_URL}")
    response = requests.post(API_URL, json=payload, headers={'Content-Type': 'application/json'})

    if response.status_code == 200:
        result = response.json()
        print("\n✅ API Cevabı Başarılı:")
        print(f"   İşlem Süresi: {result.get('processingTime')}ms")
        print(f"   Tehdit Sayısı: {result.get('threatCount')}")
        print("   Özet:")
        print(json.dumps(result.get('summary'), indent=4))
        
        if result.get('threatCount') > 0:
            print("\n   ⚠️ İlk 3 Tehdit:")
            for threat in result.get('threats')[:3]:
                print(f"     - [{threat.get('severity')}] {threat.get('description')} (IP: {threat.get('sourceIP')} -> {threat.get('targetIP')})")
        else:
            print("\n   🟢 Hiçbir tehdit tespit edilmedi.")
            
    else:
        print(f"\n❌ API Hatası (Kod: {response.status_code}):")
        print(response.text)

except Exception as e:
    print(f"\n❌ Hata: {e}")
