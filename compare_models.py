import pandas as pd
import numpy as np
import pickle
import io
import time

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
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

print("=" * 70)
print("🔬 MODEL KARŞILAŞTIRMA ANALİZİ")
print("   Random Forest vs XGBoost vs Neural Network (MLP)")
print("=" * 70)

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

# Sonuçları sakla
results = {}

# ==================== 1. RANDOM FOREST (Mevcut) ====================
print("\n" + "=" * 70)
print("🌲 1. RANDOM FOREST (Mevcut Model)")
print("=" * 70)

with open('ids_model.pkl', 'rb') as f:
    rf_model = pickle.load(f)

# Feature alignment
if hasattr(rf_model, 'feature_names_in_'):
    expected_cols = list(rf_model.feature_names_in_)
    X_train_rf = X_train.copy()
    X_test_rf = X_test.copy()
    for col in expected_cols:
        if col not in X_train_rf.columns:
            X_train_rf[col] = 0
            X_test_rf[col] = 0
    X_train_rf = X_train_rf[expected_cols]
    X_test_rf = X_test_rf[expected_cols]
else:
    X_train_rf = X_train
    X_test_rf = X_test

start_time = time.time()
y_pred_rf = rf_model.predict(X_test_rf)
rf_inference_time = time.time() - start_time

rf_accuracy = accuracy_score(y_test, y_pred_rf)
rf_precision = precision_score(y_test, y_pred_rf, average='weighted', zero_division=0)
rf_recall = recall_score(y_test, y_pred_rf, average='weighted', zero_division=0)
rf_f1 = f1_score(y_test, y_pred_rf, average='weighted', zero_division=0)
rf_cm = confusion_matrix(y_test, y_pred_rf)

print(f"   🎯 Accuracy:  {rf_accuracy * 100:.2f}%")
print(f"   📏 Precision: {rf_precision * 100:.2f}%")
print(f"   🔍 Recall:    {rf_recall * 100:.2f}%")
print(f"   ⚖️  F1-Score:  {rf_f1 * 100:.2f}%")
print(f"   ⏱️  Inference: {rf_inference_time:.2f}s")

results['Random Forest'] = {
    'accuracy': rf_accuracy,
    'precision': rf_precision,
    'recall': rf_recall,
    'f1': rf_f1,
    'inference_time': rf_inference_time,
    'cm': rf_cm.tolist()
}

# ==================== 2. XGBOOST ====================
print("\n" + "=" * 70)
print("🚀 2. XGBOOST")
print("=" * 70)

xgb_model = XGBClassifier(
    n_estimators=100,
    max_depth=10,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1,
    eval_metric='logloss',
    verbosity=0
)

print("   Eğitim başlıyor...")
start_time = time.time()
xgb_model.fit(X_train, y_train)
xgb_training_time = time.time() - start_time

start_time = time.time()
y_pred_xgb = xgb_model.predict(X_test)
xgb_inference_time = time.time() - start_time

xgb_accuracy = accuracy_score(y_test, y_pred_xgb)
xgb_precision = precision_score(y_test, y_pred_xgb, average='weighted', zero_division=0)
xgb_recall = recall_score(y_test, y_pred_xgb, average='weighted', zero_division=0)
xgb_f1 = f1_score(y_test, y_pred_xgb, average='weighted', zero_division=0)
xgb_cm = confusion_matrix(y_test, y_pred_xgb)

print(f"   🎯 Accuracy:  {xgb_accuracy * 100:.2f}%")
print(f"   📏 Precision: {xgb_precision * 100:.2f}%")
print(f"   🔍 Recall:    {xgb_recall * 100:.2f}%")
print(f"   ⚖️  F1-Score:  {xgb_f1 * 100:.2f}%")
print(f"   ⏱️  Training:  {xgb_training_time:.2f}s")
print(f"   ⏱️  Inference: {xgb_inference_time:.2f}s")

# XGBoost modelini kaydet
with open('xgboost_ids_model.pkl', 'wb') as f:
    pickle.dump(xgb_model, f)

results['XGBoost'] = {
    'accuracy': xgb_accuracy,
    'precision': xgb_precision,
    'recall': xgb_recall,
    'f1': xgb_f1,
    'training_time': xgb_training_time,
    'inference_time': xgb_inference_time,
    'cm': xgb_cm.tolist()
}

# ==================== 3. NEURAL NETWORK (MLP) ====================
print("\n" + "=" * 70)
print("🧠 3. NEURAL NETWORK (MLPClassifier)")
print("=" * 70)

# Veriyi normalize et (Neural Network için önemli)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

mlp_model = MLPClassifier(
    hidden_layer_sizes=(128, 64, 32),
    activation='relu',
    solver='adam',
    max_iter=100,
    random_state=42,
    early_stopping=True,
    validation_fraction=0.1,
    verbose=False
)

print("   Eğitim başlıyor...")
start_time = time.time()
mlp_model.fit(X_train_scaled, y_train)
mlp_training_time = time.time() - start_time

start_time = time.time()
y_pred_mlp = mlp_model.predict(X_test_scaled)
mlp_inference_time = time.time() - start_time

mlp_accuracy = accuracy_score(y_test, y_pred_mlp)
mlp_precision = precision_score(y_test, y_pred_mlp, average='weighted', zero_division=0)
mlp_recall = recall_score(y_test, y_pred_mlp, average='weighted', zero_division=0)
mlp_f1 = f1_score(y_test, y_pred_mlp, average='weighted', zero_division=0)
mlp_cm = confusion_matrix(y_test, y_pred_mlp)

print(f"   🎯 Accuracy:  {mlp_accuracy * 100:.2f}%")
print(f"   📏 Precision: {mlp_precision * 100:.2f}%")
print(f"   🔍 Recall:    {mlp_recall * 100:.2f}%")
print(f"   ⚖️  F1-Score:  {mlp_f1 * 100:.2f}%")
print(f"   ⏱️  Training:  {mlp_training_time:.2f}s")
print(f"   ⏱️  Inference: {mlp_inference_time:.2f}s")

# MLP modelini kaydet
with open('mlp_ids_model.pkl', 'wb') as f:
    pickle.dump(mlp_model, f)
with open('mlp_scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

results['Neural Network (MLP)'] = {
    'accuracy': mlp_accuracy,
    'precision': mlp_precision,
    'recall': mlp_recall,
    'f1': mlp_f1,
    'training_time': mlp_training_time,
    'inference_time': mlp_inference_time,
    'cm': mlp_cm.tolist()
}

# ==================== KARŞILAŞTIRMA TABLOSU ====================
print("\n" + "=" * 70)
print("📊 KARŞILAŞTIRMA TABLOSU")
print("=" * 70)

print("\n{:<20} {:>12} {:>12} {:>12} {:>12}".format(
    "Model", "Accuracy", "Precision", "Recall", "F1-Score"))
print("-" * 70)

for model_name, metrics in results.items():
    print("{:<20} {:>11.2f}% {:>11.2f}% {:>11.2f}% {:>11.2f}%".format(
        model_name,
        metrics['accuracy'] * 100,
        metrics['precision'] * 100,
        metrics['recall'] * 100,
        metrics['f1'] * 100
    ))

# En iyi modeli bul
best_model = max(results.items(), key=lambda x: x[1]['accuracy'])
print(f"\n🏆 EN İYİ MODEL: {best_model[0]} ({best_model[1]['accuracy']*100:.2f}%)")

# Sonuçları kaydet
with open('model_comparison_results.pkl', 'wb') as f:
    pickle.dump(results, f)

print("\n✅ Tüm sonuçlar 'model_comparison_results.pkl' dosyasına kaydedildi!")
print("=" * 70)
