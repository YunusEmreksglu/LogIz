import pickle
import pandas as pd
import numpy as np

try:
    # Model yükle (Feature isimlerini almak için)
    model = pickle.load(open('ids_model.pkl', 'rb'))
    if hasattr(model, 'feature_names_in_'):
        features = list(model.feature_names_in_)
    else:
        # Eski model ise manuel listele (ama feature_names_in_ olmalı)
        # Varsayılanlar (Eğer modelde feature name yoksa, train_model.py ile aynı featureları varsayalım)
        features = ["dur","proto","service","state","spkts","dpkts","sbytes","dbytes","rate","sload","dload","sloss","dloss","sinpkt","dinpkt","sjit","djit","swin","stcpb","dtcpb","dwin","tcprtt","synack","ackdat","smean","dmean","trans_depth","response_body_len","ct_src_dport_ltm","ct_dst_sport_ltm","is_ftp_login","ct_ftp_cmd","ct_flw_http_mthd","is_sm_ips_ports"]

    print(f"Feature sayısı: {len(features)}")
    
    # 200 Kayıt
    n_samples = 200
    np.random.seed(123) # Farklı seed
    
    data = {}
    for feat in features:
        if feat in ['proto', 'service', 'state']:
            # Kategorik olanlar
            if feat == 'proto':
                data[feat] = np.random.choice(['tcp', 'udp', 'icmp', 'arp'], n_samples)
            elif feat == 'service':
                data[feat] = np.random.choice(['http', 'ftp', 'ssh', 'dns', '-'], n_samples)
            else:
                data[feat] = np.random.choice(['FIN', 'CON', 'INT', 'REQ', 'URP'], n_samples)
        else:
            # Numerik olanlar
            # Biraz daha gerçekçi değerler sallayalım
            if 'pkts' in feat:
                data[feat] = np.random.randint(0, 100, n_samples)
            elif 'bytes' in feat:
                data[feat] = np.random.randint(0, 50000, n_samples)
            else:
                data[feat] = np.random.rand(n_samples) * 10
    
    # Label ve attack_cat ekle (Bunlar analizde ignore edilecek ama dosyada bulunsun)
    # %30 Attack olsun
    data['label'] = np.random.choice([0, 1], n_samples, p=[0.7, 0.3])
    data['attack_cat'] = np.where(data['label'] == 1, 
                                  np.random.choice(['DoS', 'Exploits', 'Fuzzers', 'Generic', 'Reconnaissance'], n_samples),
                                  'Normal')
    
    df = pd.DataFrame(data)
    
    # CSV Kaydet
    filename = 'fake_logs_200.csv'
    df.to_csv(filename, index=False)
    print(f"\n✅ {filename} başarıyla oluşturuldu!")
    print(f"Toplam {len(df)} kayıt.")
    print(f"Saldırı sayısı: {sum(df['label'] == 1)}")
    
except Exception as e:
    print(f"Hata: {e}")
