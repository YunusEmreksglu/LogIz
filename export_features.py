import pickle
import os

model_path = 'ids_model.pkl'

if os.path.exists(model_path):
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        if hasattr(model, 'feature_names_in_'):
            with open('features.txt', 'w') as f_out:
                for feature in model.feature_names_in_:
                    f_out.write(f"{feature}\n")
            print("✅ Features written to features.txt")
        else:
            print("⚠️ Model does not store feature names.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print(f"❌ Model file not found")
