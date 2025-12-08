import urllib.request
import json

# CSV content matching the model's expected features
# Features: dur,proto,service,state,spkts,dpkts,sbytes,dbytes,rate,sload,dload,sloss,dloss,sinpkt,dinpkt,sjit,djit,swin,stcpb,dtcpb,dwin,tcprtt,synack,ackdat,smean,dmean,trans_depth,response_body_len,ct_src_dport_ltm,ct_dst_sport_ltm,is_ftp_login,ct_ftp_cmd,ct_flw_http_mthd,is_sm_ips_ports
csv_content = """dur,proto,service,state,spkts,dpkts,sbytes,dbytes,rate,sload,dload,sloss,dloss,sinpkt,dinpkt,sjit,djit,swin,stcpb,dtcpb,dwin,tcprtt,synack,ackdat,smean,dmean,trans_depth,response_body_len,ct_src_dport_ltm,ct_dst_sport_ltm,is_ftp_login,ct_ftp_cmd,ct_flw_http_mthd,is_sm_ips_ports
0.000011,udp,-,INT,2,0,496,0,90909.0902,180363632,0,0,0,0.011,0,0,0,0,0,0,0,0,0,0,248,0,0,0,1,1,0,0,0,0
"""

payload = {
    "log_content": csv_content,
    "filename": "test_sample.csv",
    "file_type": "csv"
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request("http://localhost:8000/analyze", data=data, headers={'Content-Type': 'application/json'})

try:
    print("📡 Sending request to http://localhost:8000/analyze...")
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode('utf-8'))
        print("\n✅ API Response Received!")
        print(json.dumps(result, indent=2))
        
        if result.get('success'):
            print("\n🎉 Model successfully processed the data!")
            print(f"Threats detected: {result.get('threatCount')}")
        else:
            print("\n⚠️ API returned success=False")
            print(f"Error: {result.get('error')}")

except Exception as e:
    print(f"\n❌ Connection error: {str(e)}")
