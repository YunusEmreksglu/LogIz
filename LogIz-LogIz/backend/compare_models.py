"""
Model Karşılaştırma Raporu - LogIz IDS
Tüm modelleri 175K UNSW-NB15 veri setiyle değerlendirir
"""

import pandas as pd
import numpy as np
import pickle
import io
import time
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score
)
from datetime import datetime

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
print("🔬 MODEL KARŞILAŞTIRMA RAPORU - LogIz IDS")
print("=" * 70)
print(f"📅 Tarih: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

# Veri setini yükle
print("📊 Veri seti yükleniyor (123.csv - 175K satır)...")
df = load_and_clean_csv('123.csv')
print(f"   Toplam kayıt: {len(df):,}")

# Saldırı dağılımını göster
if 'attack_cat' in df.columns:
    print("\n📈 Saldırı Türü Dağılımı:")
    attack_dist = df['attack_cat'].value_counts()
    for attack_type, count in attack_dist.items():
        pct = (count / len(df)) * 100
        print(f"   {attack_type}: {count:,} ({pct:.1f}%)")

# Encoderları yükle
print("\n📂 Encoderlar yükleniyor...")
with open('encoders.pkl', 'rb') as f:
    encoders = pickle.load(f)

# Kategorik kolonları encode et
categorical_cols = ["proto", "service", "state", "attack_cat"]
df_encoded = df.copy()

for col in categorical_cols:
    if col in df_encoded.columns and col in encoders:
        le = encoders[col]
        df_encoded[col] = df_encoded[col].astype(str)
        known_classes = set(le.classes_)
        fallback_value = 'unknown' if 'unknown' in known_classes else le.classes_[0]
        df_encoded[col] = df_encoded[col].apply(lambda x: x if x in known_classes else fallback_value)
        df_encoded[col] = le.transform(df_encoded[col])

# Feature ve Label ayır
X = df_encoded.drop(columns=['label', 'attack_cat', 'id'], errors='ignore')
y = df_encoded['label']

# Train/Test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\n📊 Veri Bölümü:")
print(f"   Eğitim seti: {len(X_train):,} kayıt")
print(f"   Test seti: {len(X_test):,} kayıt")
print(f"   Feature sayısı: {len(X.columns)}")

# Model listesi
models_to_compare = [
    {
        'name': 'Random Forest',
        'file': 'ids_model.pkl',
        'type': 'sklearn'
    },
    {
        'name': 'XGBoost',
        'file': 'xgboost_ids_model.pkl',
        'type': 'xgboost'
    }
]

results = []

print("\n" + "=" * 70)
print("🧪 MODEL DEĞERLENDİRMELERİ")
print("=" * 70)

for model_info in models_to_compare:
    print(f"\n{'─' * 50}")
    print(f"🔮 {model_info['name']} Modeli")
    print(f"{'─' * 50}")
    
    try:
        # Model yükle
        with open(model_info['file'], 'rb') as f:
            model = pickle.load(f)
        
        # Feature hizalama
        X_test_aligned = X_test.copy()
        if hasattr(model, 'feature_names_in_'):
            expected_cols = list(model.feature_names_in_)
            for col in expected_cols:
                if col not in X_test_aligned.columns:
                    X_test_aligned[col] = 0
            X_test_aligned = X_test_aligned[expected_cols]
        
        # Tahmin zamanı ölç
        start_time = time.time()
        y_pred = model.predict(X_test_aligned)
        prediction_time = time.time() - start_time
        
        # Olasılıklar (eğer varsa)
        try:
            y_proba = model.predict_proba(X_test_aligned)[:, 1]
            auc_score = roc_auc_score(y_test, y_proba)
        except:
            auc_score = None
        
        # Metrikler
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = cm.ravel()
        
        # Sonuçları kaydet
        result = {
            'Model': model_info['name'],
            'Accuracy': accuracy,
            'Precision': precision,
            'Recall': recall,
            'F1-Score': f1,
            'AUC-ROC': auc_score,
            'True Positive': tp,
            'True Negative': tn,
            'False Positive': fp,
            'False Negative': fn,
            'Prediction Time (s)': prediction_time
        }
        results.append(result)
        
        # Sonuçları yazdır
        print(f"   🎯 Accuracy:  {accuracy * 100:.2f}%")
        print(f"   📏 Precision: {precision * 100:.2f}%")
        print(f"   🔍 Recall:    {recall * 100:.2f}%")
        print(f"   ⚖️  F1-Score:  {f1 * 100:.2f}%")
        if auc_score:
            print(f"   📈 AUC-ROC:   {auc_score:.4f}")
        print(f"   ⏱️  Süre:      {prediction_time:.2f}s ({len(X_test)/prediction_time:.0f} kayıt/sn)")
        print()
        print(f"   Confusion Matrix:")
        print(f"     ┌─────────────────┬─────────────────┐")
        print(f"     │ TN: {tn:>10,} │ FP: {fp:>10,} │")
        print(f"     ├─────────────────┼─────────────────┤")
        print(f"     │ FN: {fn:>10,} │ TP: {tp:>10,} │")
        print(f"     └─────────────────┴─────────────────┘")
        
    except Exception as e:
        print(f"   ❌ Hata: {e}")
        results.append({
            'Model': model_info['name'],
            'Accuracy': 0,
            'Error': str(e)
        })

# Karşılaştırma Özeti
print("\n" + "=" * 70)
print("📊 KARŞILAŞTIRMA ÖZETİ")
print("=" * 70)

if len(results) > 1:
    # En iyi modeli bul
    best_accuracy = max(r['Accuracy'] for r in results if 'Accuracy' in r)
    best_f1 = max(r['F1-Score'] for r in results if 'F1-Score' in r)
    
    print("\n┌────────────────────┬───────────┬───────────┬───────────┬───────────┐")
    print("│ Model              │ Accuracy  │ Precision │ Recall    │ F1-Score  │")
    print("├────────────────────┼───────────┼───────────┼───────────┼───────────┤")
    
    for r in results:
        if 'Accuracy' in r and r['Accuracy'] > 0:
            acc_str = f"{r['Accuracy']*100:.2f}%"
            prec_str = f"{r['Precision']*100:.2f}%"
            rec_str = f"{r['Recall']*100:.2f}%"
            f1_str = f"{r['F1-Score']*100:.2f}%"
            
            # En iyi değerleri işaretle
            if r['Accuracy'] == best_accuracy:
                acc_str = f"★{acc_str}"
            if r['F1-Score'] == best_f1:
                f1_str = f"★{f1_str}"
            
            print(f"│ {r['Model']:<18} │ {acc_str:>9} │ {prec_str:>9} │ {rec_str:>9} │ {f1_str:>9} │")
    
    print("└────────────────────┴───────────┴───────────┴───────────┴───────────┘")
    print("(★ = En iyi değer)")

# Öneriler
print("\n" + "=" * 70)
print("💡 ÖNERİLER")
print("=" * 70)

best_model = max(results, key=lambda x: x.get('F1-Score', 0))
print(f"\n✅ Önerilen Model: {best_model['Model']}")
print(f"   F1-Score: {best_model.get('F1-Score', 0)*100:.2f}%")

if best_model.get('False Negative', 0) > 0:
    fn_rate = best_model['False Negative'] / (best_model['False Negative'] + best_model['True Positive']) * 100
    print(f"\n⚠️  Dikkat: {fn_rate:.2f}% saldırı kaçırılıyor (False Negative)")
    print("   Recall'ı artırmak için threshold düşürülebilir.")

print("\n" + "=" * 70)
print("✅ Rapor Tamamlandı!")
print("=" * 70)

# Sonuçları dosyaya kaydet
report_file = "model_comparison_report.txt"
with open(report_file, 'w', encoding='utf-8') as f:
    f.write("MODEL KARSILASTIRMA RAPORU - LogIz IDS\n")
    f.write("=" * 50 + "\n\n")
    
    for r in results:
        if 'Accuracy' in r and r['Accuracy'] > 0:
            f.write(f"Model: {r['Model']}\n")
            f.write(f"  Accuracy:  {r['Accuracy']*100:.2f}%\n")
            f.write(f"  Precision: {r['Precision']*100:.2f}%\n")
            f.write(f"  Recall:    {r['Recall']*100:.2f}%\n")
            f.write(f"  F1-Score:  {r['F1-Score']*100:.2f}%\n")
            if r.get('AUC-ROC'):
                f.write(f"  AUC-ROC:   {r['AUC-ROC']:.4f}\n")
            f.write(f"  TP: {r['True Positive']}, TN: {r['True Negative']}\n")
            f.write(f"  FP: {r['False Positive']}, FN: {r['False Negative']}\n")
            f.write(f"  Prediction Time: {r['Prediction Time (s)']:.2f}s\n")
            f.write("\n")
    
    f.write(f"\nOnerilen Model: {best_model['Model']}\n")

print(f"\n📄 Rapor kaydedildi: {report_file}")
