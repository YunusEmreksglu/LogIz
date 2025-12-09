import pickle
import pandas as pd
import numpy as np

# Model yükle
model = pickle.load(open('ids_model.pkl', 'rb'))
features = list(model.feature_names_in_)
print(f"Feature sayısı: {len(features)}")
print(f"Features: {features}")

# Bu feature'lara uygun örnek veri oluştur
np.random.seed(42)
n_samples = 10

data = {}
for feat in features:
    if feat in ['proto', 'service', 'state']:
        # Kategorik olanlar
        if feat == 'proto':
            data[feat] = np.random.choice(['tcp', 'udp', 'icmp'], n_samples)
        elif feat == 'service':
            data[feat] = np.random.choice(['http', 'ftp', 'ssh', '-'], n_samples)
        else:
            data[feat] = np.random.choice(['FIN', 'CON', 'INT', 'REQ'], n_samples)
    else:
        # Numerik olanlar
        data[feat] = np.random.rand(n_samples) * 100

# Label ve attack_cat ekle (bunlar drop edilecek)
data['label'] = np.random.choice([0, 1], n_samples)
data['attack_cat'] = np.random.choice(['Normal', 'DoS', 'Reconnaissance'], n_samples)

df = pd.DataFrame(data)
df.to_csv('unsw_sample.csv', index=False)
print(f"\nunsw_sample.csv oluşturuldu ({len(df)} satır)")
print(f"Sütunlar: {list(df.columns)}")
