import pandas as pd
import sys

file_path = '123.csv'
report_file = 'ground_truth_report.txt'

try:
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(f"📂 Analyzing {file_path}...\n")
        
        # Read the file
        df = pd.read_csv(file_path)
        
        # LABEL Check
        if 'label' in df.columns:
            label_counts = df['label'].value_counts()
            f.write("\n📊 'label' Column Distribution (0=Normal, 1=Attack):\n")
            f.write(str(label_counts) + "\n")
        else:
            f.write("\n❌ 'label' column not found.\n")

        # ATTACK_CAT Check
        if 'attack_cat' in df.columns:
            attack_counts = df['attack_cat'].value_counts()
            f.write("\n📊 'attack_cat' Column Distribution:\n")
            f.write(str(attack_counts) + "\n")
        else:
            f.write("\n❌ 'attack_cat' column not found.\n")
            
        # Rate Check
        if 'rate' in df.columns:
            high_rate = df[df['rate'] > 1000]
            f.write(f"\n⚡ Records with high 'rate' (>1000): {len(high_rate)}\n")
            
    print(f"✅ Report written to {report_file}")

except Exception as e:
    with open(report_file, 'w') as f:
        f.write(f"❌ Error: {e}")
    print(f"❌ Error: {e}")
