# -*- coding: utf-8 -*-
"""
ML Prediction Benchmark Test - JSON output
"""

import pandas as pd
import numpy as np
import pickle
import time
import io
import json
import gc

def load_and_clean_csv(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.splitlines()
    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if line.startswith('"') and line.endswith('"'):
            line = line[1:-1]
        cleaned_lines.append(line)
    
    return pd.read_csv(io.StringIO("\n".join(cleaned_lines)))

# Model ve encoder yukle
with open('ids_model.pkl', 'rb') as f:
    model = pickle.load(f)
with open('encoders.pkl', 'rb') as f:
    encoders = pickle.load(f)

# Veriyi yukle
df = load_and_clean_csv('123.csv')
total_rows = len(df)

# Kategorik kolonlari encode et
categorical_cols = ["proto", "service", "state", "attack_cat"]
for col in categorical_cols:
    if col in df.columns and col in encoders:
        le = encoders[col]
        df[col] = df[col].astype(str)
        known_classes = set(le.classes_)
        fallback_value = 'unknown' if 'unknown' in known_classes else le.classes_[0]
        df[col] = df[col].apply(lambda x: x if x in known_classes else fallback_value)
        df[col] = le.transform(df[col])

# Feature'lari hazirla
X = df.drop(columns=['label', 'attack_cat', 'id'], errors='ignore')

if hasattr(model, 'feature_names_in_'):
    expected_cols = model.feature_names_in_
    for col in expected_cols:
        if col not in X.columns:
            X[col] = 0
    X = X[expected_cols]

n_samples = len(X)
feature_count = X.shape[1]

# TEST 1: NORMAL PREDICTION
gc.collect()
start_normal = time.time()
probabilities_normal = model.predict_proba(X)[:, 1]
predictions_normal = (probabilities_normal > 0.5).astype(int)
time_normal = time.time() - start_normal
attacks_normal = int(np.sum(predictions_normal))
speed_normal = n_samples / time_normal

del probabilities_normal, predictions_normal
gc.collect()

# TEST 2: BATCH PROCESSING
BATCH_SIZE = 10000
gc.collect()
start_batch = time.time()

probabilities_batch = np.zeros(n_samples)
n_batches = (n_samples - 1) // BATCH_SIZE + 1

for i in range(0, n_samples, BATCH_SIZE):
    batch_end = min(i + BATCH_SIZE, n_samples)
    batch_X = X.iloc[i:batch_end]
    probabilities_batch[i:batch_end] = model.predict_proba(batch_X)[:, 1]

predictions_batch = (probabilities_batch > 0.5).astype(int)
time_batch = time.time() - start_batch
attacks_batch = int(np.sum(predictions_batch))
speed_batch = n_samples / time_batch

# Sonuclari hesapla
time_diff_percent = ((time_batch - time_normal) / time_normal) * 100 if time_normal > 0 else 0

results = {
    "test_file": "123.csv",
    "total_rows": total_rows,
    "feature_count": feature_count,
    "batch_size": BATCH_SIZE,
    "num_batches": n_batches,
    "normal": {
        "time_seconds": round(time_normal, 2),
        "speed_rows_per_sec": round(speed_normal, 0),
        "attacks_detected": attacks_normal
    },
    "batch": {
        "time_seconds": round(time_batch, 2),
        "speed_rows_per_sec": round(speed_batch, 0),
        "attacks_detected": attacks_batch
    },
    "comparison": {
        "time_difference_percent": round(time_diff_percent, 1),
        "winner": "BATCH" if time_batch < time_normal else "NORMAL",
        "advantage_percent": round(abs(time_diff_percent), 1)
    }
}

# JSON dosyasina kaydet
with open('benchmark_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("BENCHMARK COMPLETE - Results saved to benchmark_results.json")
print(f"Normal: {time_normal:.2f}s, Batch: {time_batch:.2f}s")
print(f"Winner: {results['comparison']['winner']}")
