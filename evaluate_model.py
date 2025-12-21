import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import io

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
print("🧪 MODEL DOĞRULUK ANALİZİ")
print("=" * 60)

# Model ve Encoderları yükle
print("\n📂 Model yükleniyor...")
with open('ids_model.pkl', 'rb') as f:
    model = pickle.load(f)

with open('encoders.pkl', 'rb') as f:
    encoders = pickle.load(f)

# Veriyi yükle (123.csv - Ana veri seti)
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

# Modelin beklediği sütunları hizala
if hasattr(model, 'feature_names_in_'):
    expected_cols = list(model.feature_names_in_)
    for col in expected_cols:
        if col not in X.columns:
            X[col] = 0
    X = X[expected_cols]

# Train/Test split (Model zaten bu veriyle eğitilmiş olabilir, ama yine de bakalım)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"\n📊 Test Seti Boyutu: {len(X_test)} kayıt")

# Tahmin yap
print("\n🔮 Tahmin yapılıyor...")
y_pred = model.predict(X_test)

# Metrikler
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

print("\n" + "=" * 60)
print("📈 MODEL PERFORMANS METRİKLERİ")
print("=" * 60)
print(f"\n   🎯 Accuracy (Doğruluk):  {accuracy * 100:.2f}%")
print(f"   📏 Precision (Kesinlik): {precision * 100:.2f}%")
print(f"   🔍 Recall (Duyarlılık):  {recall * 100:.2f}%")
print(f"   ⚖️  F1-Score:            {f1 * 100:.2f}%")

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
print("\n📊 Confusion Matrix:")
print(f"   True Negative (Normal doğru):  {cm[0][0]}")
print(f"   False Positive (Yanlış alarm): {cm[0][1]}")
print(f"   False Negative (Kaçırılan):    {cm[1][0]}")
print(f"   True Positive (Saldırı doğru): {cm[1][1]}")

# Classification Report
print("\n📋 Detaylı Rapor:")
print(classification_report(y_test, y_pred, target_names=['Normal (0)', 'Saldırı (1)']))

print("=" * 60)
print("✅ Analiz Tamamlandı!")
print("=" * 60)
