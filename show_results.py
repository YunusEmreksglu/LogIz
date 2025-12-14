import pickle
import json

# Sonuçları yükle
with open('model_comparison_results.pkl', 'rb') as f:
    results = pickle.load(f)

print("=" * 70)
print("MODEL KARŞILAŞTIRMA SONUÇLARI")
print("=" * 70)

for model_name, metrics in results.items():
    print(f"\n{model_name}:")
    print(f"  Accuracy:  {metrics['accuracy']*100:.2f}%")
    print(f"  Precision: {metrics['precision']*100:.2f}%")
    print(f"  Recall:    {metrics['recall']*100:.2f}%")
    print(f"  F1-Score:  {metrics['f1']*100:.2f}%")
    if 'training_time' in metrics:
        print(f"  Training:  {metrics['training_time']:.2f}s")
    print(f"  Inference: {metrics['inference_time']:.2f}s")
    print(f"  Confusion Matrix: {metrics['cm']}")

print("\n" + "=" * 70)
