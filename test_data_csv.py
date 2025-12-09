import requests
import base64
import json

url = "http://127.0.0.1:5000/api/analyze/upload"
filename = "data.csv"

try:
    with open(filename, "rb") as f:
        file_content = f.read()
        
    base64_content = base64.b64encode(file_content).decode('utf-8')
    
    payload = {
        "file_content": base64_content,
        "filename": filename
    }
    
    headers = {
        "Content-Type": "application/json"
        # Authorization header'ı test ortamında gerekli olmayabilir veya app.py kontrol etmiyor olabilir (app.py koduna baktım, auth kontrolü decorator ile yok gibiydi, ama lib/python-api.ts gönderiyor)
    }

    response = requests.post(url, json=payload, headers=headers)
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success: {data.get('success')}")
        print(f"Attacks detected: {data.get('results', {}).get('attacks_detected')}")
        print(f"Total records: {data.get('results', {}).get('total_records')}")
        if 'attacks' in data and data['attacks']:
            print(f"\nExample attack: {data['attacks'][0]}")
    else:
        print(f"Error Response: {response.text}")

except Exception as e:
    print(f"Error: {e}")
