import requests

url = "http://127.0.0.1:5000/api/analyze/upload"
files = {"file": open("unsw_sample.csv", "rb")}

try:
    response = requests.post(url, files=files)
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Success: {data.get('success')}")
    print(f"Attacks detected: {data.get('results', {}).get('attacks_detected')}")
    print(f"Total records: {data.get('results', {}).get('total_records')}")
    if 'attacks' in data:
        print(f"\nFirst attack: {data['attacks'][0] if data['attacks'] else 'None'}")
except Exception as e:
    print(f"Error: {e}")
