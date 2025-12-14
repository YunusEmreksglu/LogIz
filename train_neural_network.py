"""
Saf PyTorch ile Neural Network Eğitimi
DLL sorunu varsa alternatif olarak scikit-learn MLPClassifier kullanılacak
"""
import pandas as pd
import numpy as np
import pickle
import io
import time

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.preprocessing import StandardScaler

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
print("🧠 PYTORCH NEURAL NETWORK EĞİTİMİ")
print("=" * 60)

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import TensorDataset, DataLoader
    print("✅ PyTorch başarıyla yüklendi!")
    USE_PYTORCH = True
except Exception as e:
    print(f"❌ PyTorch yüklenemedi: {e}")
    print("🔄 Scikit-learn MLPClassifier kullanılacak...")
    USE_PYTORCH = False

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

# Veriyi normalize et
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print(f"\n📊 Eğitim Seti: {len(X_train)} kayıt")
print(f"📊 Test Seti: {len(X_test)} kayıt")
print(f"📊 Feature Sayısı: {X_train.shape[1]}")

if USE_PYTORCH:
    # PyTorch Model
    class NeuralNetwork(nn.Module):
        def __init__(self, input_size):
            super(NeuralNetwork, self).__init__()
            self.layer1 = nn.Linear(input_size, 128)
            self.bn1 = nn.BatchNorm1d(128)
            self.layer2 = nn.Linear(128, 64)
            self.bn2 = nn.BatchNorm1d(64)
            self.layer3 = nn.Linear(64, 32)
            self.layer4 = nn.Linear(32, 1)
            self.relu = nn.ReLU()
            self.dropout = nn.Dropout(0.3)
            self.sigmoid = nn.Sigmoid()
        
        def forward(self, x):
            x = self.relu(self.bn1(self.layer1(x)))
            x = self.dropout(x)
            x = self.relu(self.bn2(self.layer2(x)))
            x = self.dropout(x)
            x = self.relu(self.layer3(x))
            x = self.sigmoid(self.layer4(x))
            return x

    print("\n🏗️ PyTorch Modeli oluşturuluyor...")
    model = NeuralNetwork(X_train.shape[1])
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    # DataLoader
    X_train_tensor = torch.FloatTensor(X_train_scaled)
    y_train_tensor = torch.FloatTensor(y_train.values).reshape(-1, 1)
    X_test_tensor = torch.FloatTensor(X_test_scaled)
    y_test_tensor = torch.FloatTensor(y_test.values).reshape(-1, 1)

    train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
    train_loader = DataLoader(train_dataset, batch_size=256, shuffle=True)

    # Eğitim
    print("\n🚀 Eğitim başlıyor...")
    start_time = time.time()
    epochs = 20
    
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for batch_X, batch_y in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        
        if (epoch + 1) % 5 == 0:
            print(f"   Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(train_loader):.4f}")

    training_time = time.time() - start_time

    # Tahmin
    print("\n🔮 Tahmin yapılıyor...")
    model.eval()
    with torch.no_grad():
        y_pred_prob = model(X_test_tensor).numpy()
        y_pred = (y_pred_prob > 0.5).astype(int).flatten()

    model_name = 'PyTorch Neural Network'

else:
    # Scikit-learn MLPClassifier (fallback)
    from sklearn.neural_network import MLPClassifier
    
    print("\n🏗️ MLPClassifier Modeli oluşturuluyor...")
    model = MLPClassifier(
        hidden_layer_sizes=(128, 64, 32),
        activation='relu',
        solver='adam',
        max_iter=100,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.1,
        verbose=True
    )

    print("\n🚀 Eğitim başlıyor...")
    start_time = time.time()
    model.fit(X_train_scaled, y_train)
    training_time = time.time() - start_time

    print("\n🔮 Tahmin yapılıyor...")
    y_pred = model.predict(X_test_scaled)
    
    model_name = 'Keras/Neural Network (MLPClassifier)'

# Metrikler
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
cm = confusion_matrix(y_test, y_pred)

print("\n" + "=" * 60)
print(f"📈 {model_name.upper()} PERFORMANS SONUÇLARI")
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
    'model': model_name,
    'accuracy': accuracy,
    'precision': precision,
    'recall': recall,
    'f1': f1,
    'training_time': training_time,
    'confusion_matrix': cm.tolist()
}

with open('keras_results.pkl', 'wb') as f:
    pickle.dump(results, f)

print(f"\n✅ {model_name} sonuçları kaydedildi!")
print("=" * 60)
