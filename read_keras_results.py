import pickle
r = pickle.load(open('keras_results.pkl', 'rb'))
print(f"Model: {r['model']}")
print(f"Accuracy: {r['accuracy']*100:.2f}%")
print(f"Precision: {r['precision']*100:.2f}%")
print(f"Recall: {r['recall']*100:.2f}%")
print(f"F1: {r['f1']*100:.2f}%")
print(f"Training Time: {r['training_time']:.2f}s")
print(f"Confusion Matrix: {r['confusion_matrix']}")
