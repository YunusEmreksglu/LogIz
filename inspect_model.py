import pickle
import os
import sklearn

print(f"Scikit-learn version: {sklearn.__version__}")

model_path = 'ids_model.pkl'

if os.path.exists(model_path):
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        print("\n✅ Model loaded successfully!")
        print(f"Type: {type(model)}")
        
        if hasattr(model, 'feature_names_in_'):
            print("\n📋 Expected Features (feature_names_in_):")
            print(list(model.feature_names_in_))
        elif hasattr(model, 'n_features_in_'):
            print(f"\n🔢 Number of expected features: {model.n_features_in_}")
            print("⚠️ Model does not store feature names. You must match the exact number and order of features used during training.")
        else:
            print("\n⚠️ Could not determine feature information.")
            
    except Exception as e:
        print(f"\n❌ Error loading model: {e}")
else:
    print(f"\n❌ Model file not found at {model_path}")
