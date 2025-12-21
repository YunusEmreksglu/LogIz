import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import pickle
import io

def load_and_clean_csv(filename):
    """CSV dosyasını okur ve tırnak işaretlerini temizler"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Tırnakları temizle (Eğer tüm satır "..." içindeyse)
    lines = content.splitlines()
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if line.startswith('"') and line.endswith('"'):
            line = line[1:-1]
        cleaned_lines.append(line)
    
    cleaned_content = "\n".join(cleaned_lines)
    return pd.read_csv(io.StringIO(cleaned_content))

print("📊 Veriler yükleniyor...")
# 1. Mevcut sample veriyi yükle (Saldırı datası için)
df_sample = load_and_clean_csv('unsw_sample.csv')
print(f"Sample veri: {len(df_sample)} satır")

# 2. Kullanıcı verisini yükle (Normal data)
try:
    df_user = load_and_clean_csv('data.csv')
    print(f"User veri: {len(df_user)} satır")
except Exception as e:
    print(f"⚠️ User veri yüklenemedi: {e}")
    df_user = pd.DataFrame()

# 3. 123.csv dosyasını yükle (Büyük veri)
try:
    df_large = load_and_clean_csv('123.csv')
    print(f"Large veri (123.csv): {len(df_large)} satır")
except Exception as e:
    print(f"⚠️ Large veri yüklenemedi: {e}")
    df_large = pd.DataFrame()

# 4. Verileri birleştir
datasets = [df_sample, df_user, df_large]
valid_datasets = [d for d in datasets if not d.empty]

if valid_datasets:
    # Tüm datasetlerdeki ortak kolonları bul
    common_cols = set(valid_datasets[0].columns)
    for d in valid_datasets[1:]:
        common_cols &= set(d.columns)
    common_cols = list(common_cols)
    
    print(f"Ortak kolon sayısı: {len(common_cols)}")
    
    df = pd.concat([d[common_cols] for d in valid_datasets], ignore_index=True)
else:
    df = df_sample

print(f"Toplam eğitim verisi: {len(df)} satır")

# 4. Preprocessing
categorical_cols = ["proto", "service", "state", "attack_cat"]
le_dict = {}

for col in categorical_cols:
    if col in df.columns:
        le = LabelEncoder()
        df[col] = df[col].astype(str)
        # Bilinmeyen değerler için 'unknown' ekle
        unique_vals = list(df[col].unique()) + ['unknown']
        le.fit(unique_vals)
        df[col] = le.transform(df[col])
        le_dict[col] = le

# 5. Model Eğitimi (Features vs Label)
# Label sütunu: 'label' (0=Normal, 1=Attack)
# Eğer label yoksa oluştur (Sample veride var, user veride var mı?)
if 'label' not in df.columns:
    df['label'] = 0 # Varsayılan normal

X = df.drop(columns=['label', 'attack_cat', 'id'], errors='ignore')

# Feature isimlerini kaydet (api mismatch olmasın diye)
feature_names = list(X.columns)
print(f"Eğitilen feature sayısı: {len(feature_names)}")

y = df['label']

print("🧠 Model eğitiliyor...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# 6. Kaydet
print("💾 Model kaydediliyor...")
with open('ids_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("💾 Encoderlar kaydediliyor...")
with open('encoders.pkl', 'wb') as f:
    pickle.dump(le_dict, f)

# Feature isimlerini de pickle objesine ekle (sklearn zaten yapar ama biz emin olalım)
model.feature_names_in_ = np.array(feature_names)

print("✅ Başarılı! ids_model.pkl güncellendi.")
