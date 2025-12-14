import pandas as pd
import numpy as np
import pickle
import io
import time
import os

# Keras backend'i PyTorch olarak ayarla
os.environ['KERAS_BACKEND'] = 'torch'

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.preprocessing import StandardScaler

import keras
from keras import layers

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
print("🧠 KERAS DEEP LEARNING MODELİ EĞİTİMİ (PyTorch Backend)")
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

# Veriyi normalize et (Keras için önemli)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"\n📊 Eğitim Seti: {len(X_train)} kayıt")
print(f"📊 Test Seti: {len(X_test)} kayıt")
print(f"📊 Feature Sayısı: {X_train.shape[1]}")

# Keras Model Oluştur
print("\n🏗️ Keras Modeli oluşturuluyor...")
model = keras.Sequential([
    layers.Dense(128, activation='relu', input_shape=(X_train.shape[1],)),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    layers.Dense(64, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    layers.Dense(32, activation='relu'),
    layers.Dense(1, activation='sigmoid')
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)

model.summary()

# Eğitim
print("\n🚀 Eğitim başlıyor...")
start_time = time.time()

early_stop = keras.callbacks.EarlyStopping(
    monitor='val_loss',
    patience=3,
    restore_best_weights=True
)

history = model.fit(
    X_train_scaled, y_train.values,
    epochs=20,
    batch_size=256,
    validation_split=0.1,
    callbacks=[early_stop],
    verbose=1
)

training_time = time.time() - start_time

# Tahmin
print("\n🔮 Tahmin yapılıyor...")
y_pred_prob = model.predict(X_test_scaled, verbose=0)
y_pred = (y_pred_prob > 0.5).astype(int).flatten()

# Metrikler
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
cm = confusion_matrix(y_test, y_pred)

print("\n" + "=" * 60)
print("📈 KERAS MODEL PERFORMANS SONUÇLARI")
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
    'model': 'Keras (PyTorch Backend)',
    'accuracy': accuracy,
    'precision': precision,
    'recall': recall,
    'f1': f1,
    'training_time': training_time,
    'confusion_matrix': cm.tolist()
}

with open('keras_results.pkl', 'wb') as f:
    pickle.dump(results, f)

# Modeli kaydet
model.save('keras_ids_model.keras')
with open('keras_scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

print("\n✅ Keras modeli ve sonuçları kaydedildi!")
print("=" * 60)
