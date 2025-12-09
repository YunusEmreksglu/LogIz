import pandas as pd

# Dosya yollarını ayarla
input_file = "UNSW_NB15_training-set.parquet"
output_file = "UNSW_NB15_training-set.csv"

print("Veri okunuyor...")
df = pd.read_parquet(input_file)

print("CSV'ye dönüştürülüyor...")
df.to_csv(output_file, index=False, encoding="utf-8")

print(f"Dönüştürme tamamlandı! Kaydedilen dosya: {output_file}")
