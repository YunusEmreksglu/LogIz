import pandas as pd
import numpy as np
import pickle
import io
import time

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from xgboost import XGBClassifier

def load_and_clean_csv(filename):
    """CSV dosyasını okur ve tırnak işaretlerini temizler"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.splitlines()
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if line.startswith('"') and line.endswith('"'):
            line = line[1:-1]
        cleaned_lines.append(line)
    
    cleaned_content = "\n".join(cleaned_lines)
    return pd.read_csv(io.StringIO(cleaned_content))

print("=" * 60)
print("🚀 XGBOOST MODELİ EĞİTİMİ")
print("=" * 60)

# Encoderları yükle
print("\n📂 Encoderlar yükleniyor...")
with open('encoders.pkl', 'rb') as f:
    encoders = pickle.load(f)

# Veriyi yükle
print("📊 Veri seti yükleniyor (123.csv)...")
df = load_and_clean_csv('123.csv')
print(f"   Toplam kayıt: {len(df)}")

# Kategorik kolonları encode et
categorical_cols = ["proto", "service", "state", "attack_cat"]
for col in categorical_cols:
    if col in df.columns and col in encoders:
        le = encoders[col]
        df[col] = df[col].astype(str)
        known_classes = set(le.classes_)
        fallback_value = 'unknown' if 'unknown' in known_classes else le.classes_[0]
        df[col] = df[col].apply(lambda x: x if x in known_classes else fallback_value)
        df[col] = le.transform(df[col])

# Feature ve Label ayır
X = df.drop(columns=['label', 'attack_cat', 'id'], errors='ignore')
y = df['label']

# Train/Test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"\n📊 Eğitim Seti: {len(X_train)} kayıt")
print(f"📊 Test Seti: {len(X_test)} kayıt")
print(f"📊 Feature Sayısı: {X_train.shape[1]}")

# XGBoost Model Oluştur
print("\n🏗️ XGBoost Modeli oluşturuluyor...")
model = XGBClassifier(
    n_estimators=100,
    max_depth=10,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1,
    use_label_encoder=False,
    eval_metric='logloss'
)

# Eğitim
print("\n🚀 Eğitim başlıyor...")
start_time = time.time()

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=True
)

training_time = time.time() - start_time

# Tahmin
print("\n🔮 Tahmin yapılıyor...")
y_pred = model.predict(X_test)

# Metrikler
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
cm = confusion_matrix(y_test, y_pred)

print("\n" + "=" * 60)
print("📈 XGBOOST MODEL PERFORMANS SONUÇLARI")
print("=" * 60)
print(f"\n   ⏱️  Eğitim Süresi:        {training_time:.2f} saniye")
print(f"   🎯 Accuracy (Doğruluk):  {accuracy * 100:.2f}%")
print(f"   📏 Precision (Kesinlik): {precision * 100:.2f}%")
print(f"   🔍 Recall (Duyarlılık):  {recall * 100:.2f}%")
print(f"   ⚖️  F1-Score:            {f1 * 100:.2f}%")

print("\n📊 Confusion Matrix:")
print(f"   True Negative:  {cm[0][0]}")
print(f"   False Positive: {cm[0][1]}")
print(f"   False Negative: {cm[1][0]}")
print(f"   True Positive:  {cm[1][1]}")

# Sonuçları dosyaya kaydet
results = {
    'model': 'XGBoost',
    'accuracy': accuracy,
    'precision': precision,
    'recall': recall,
    'f1': f1,
    'training_time': training_time,
    'confusion_matrix': cm.tolist()
}

with open('xgboost_results.pkl', 'wb') as f:
    pickle.dump(results, f)

# Modeli kaydet
with open('xgboost_ids_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("\n✅ XGBoost modeli ve sonuçları kaydedildi!")
print("=" * 60)
