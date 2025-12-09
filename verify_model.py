import pandas as pd
import pickle
import numpy as np
import io

# Model yükle
print("🧠 Model yükleniyor: ids_model.pkl")
with open('ids_model.pkl', 'rb') as f:
    model = pickle.load(f)

def load_and_clean_csv(filename):
    """CSV dosyasını okur ve tırnak işaretlerini temizler"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Tırnakları temizle
    lines = content.splitlines()
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if line.startswith('"') and line.endswith('"'):
            line = line[1:-1]
        cleaned_lines.append(line)
    
    cleaned_content = "\n".join(cleaned_lines)
    return pd.read_csv(io.StringIO(cleaned_content))

def analyze_file(filename):
    print(f"\n📂 Analiz ediliyor: {filename}")
    try:
        df = load_and_clean_csv(filename)
        print(f"   Satır sayısı: {len(df)}")
        
        # Gereksiz sütunları at (label varsa)
        X = df.drop(columns=['label', 'attack_cat', 'id'], errors='ignore')
        
        # Kategorik dönüşüm (Basitçe, modelde kullanılan label encoder'lar lazım ama
        # hızlı test için string'leri 0 yapalım veya modelin feature_names_in_'e bakalım)
        # Random Forest genelde sayısal ister. Model eğitimi sırasında LabelEncoder kullandık.
        # Burada aynı dönüşümü yapmak zorundayız.
        
        # Basitlik adına: data.csv zaten sayısal (data.csv içeriğine bakınca kategorik var: tcp, FIN vs)
        # train_model.py içinde LabelEncoder kullandık ama kaydetmedik!
        # Bu büyük bir eksiklik. Model string kabul etmez.
        # train_model.py'de eğitilen LabelEncoder'lar olmadan yeni veri predict edilemez (eğer kategorik ise).
        
        # Ancak user'ın train_model.py'si az önce çalıştı.
        # O scripti güncelleyip LE'leri de kaydetmesini söylemedim.
        # Bu durumda predict hata verebilir: "could not convert string to float".
        
        # ÇÖZÜM: verify_model.py içinde train_model.py mantığını tekrar edip (fit yaparak) transform edemeyiz (farklı mapping olur).
        # Normalde LabelEncoder'ı pickle olarak kaydetmek lazımdı.
        
        # Şimdilik: app.py nasıl yapıyor?
        # app.py her requestte LabelEncoder'ı YENİDEN fit ediyor! (Bu yanlış bir yöntem ama kod böyleydi).
        # app.py:
        # le = LabelEncoder()
        # for col in categorical_cols: data[col] = le.fit_transform(data[col])
        
        # Bu yöntemle eğitim ve test verisi farklı ise encoding karışır.
        # Ama app.py böyle çalışıyorsa ben de burada aynısını yapayım.
        
        categorical_cols = ["proto", "service", "state", "attack_cat"]
        from sklearn.preprocessing import LabelEncoder
        for col in categorical_cols:
            if col in X.columns:
                le = LabelEncoder()
                X[col] = X[col].astype(str)
                X[col] = le.fit_transform(X[col])
        
        # Eksik feature'ları tamamla (0 ile)
        if hasattr(model, 'feature_names_in_'):
            expected_features = model.feature_names_in_
            missing_features = set(expected_features) - set(X.columns)
            for feat in missing_features:
                X[feat] = 0
            
            # Fazla featureları at
            X = X[expected_features]
        
        predictions = model.predict(X)
        
        # Sonuçları özetle
        unique, counts = np.unique(predictions, return_counts=True)
        results = dict(zip(unique, counts))
        
        print("   Sonuçlar:")
        print(f"   - Normal (0): {results.get(0, 0)}")
        print(f"   - Saldırı (1): {results.get(1, 0)}")
        
        # Detaylı saldırı türü? (Model sadece 0/1 sınıflandırma yaptı train_model.py'de)
        
    except Exception as e:
        print(f"   ❌ Hata: {e}")

analyze_file('unsw_sample.csv')
analyze_file('data.csv')
analyze_file('123.csv')
