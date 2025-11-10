"""
LogIz - Mock Python AI Model API
Bu dosya, gerçek AI modeliniz hazır olana kadar test amaçlı kullanılabilir.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Mock threat patterns
THREAT_TYPES = [
    'SQL_INJECTION',
    'XSS',
    'BRUTE_FORCE',
    'PORT_SCAN',
    'DIRECTORY_TRAVERSAL',
    'COMMAND_INJECTION',
    'UNAUTHORIZED_ACCESS',
    'DDOS_ATTEMPT',
    'MALWARE_DETECTED',
    'SUSPICIOUS_ACTIVITY'
]

SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

def generate_mock_threats(log_content):
    """Generate mock threats based on log content"""
    threats = []
    
    # Simple pattern detection (mock)
    threat_keywords = {
        'SQL_INJECTION': ['SELECT', 'DROP', 'UNION', "'", '"', '--', 'OR 1=1'],
        'XSS': ['<script>', 'javascript:', 'onerror=', 'onload='],
        'BRUTE_FORCE': ['failed', 'login', 'password', 'authentication failed'],
        'COMMAND_INJECTION': [';', '&&', '||', '`', '$('],
    }
    
    log_lines = log_content.split('\n')
    
    for line_num, line in enumerate(log_lines[:100]):  # Check first 100 lines
        line_lower = line.lower()
        
        for threat_type, keywords in threat_keywords.items():
            if any(keyword.lower() in line_lower for keyword in keywords):
                severity = random.choice(['CRITICAL', 'HIGH', 'MEDIUM'])
                threats.append({
                    'type': threat_type,
                    'severity': severity,
                    'description': f'{threat_type.replace("_", " ").title()} detected in log line {line_num + 1}',
                    'sourceIP': f'{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}',
                    'targetIP': f'10.0.0.{random.randint(1, 255)}',
                    'port': random.choice([22, 80, 443, 3306, 5432, 8080]),
                    'timestamp': datetime.now().isoformat(),
                    'rawLog': line[:200],  # First 200 chars
                    'confidence': round(random.uniform(0.7, 0.99), 2)
                })
    
    # If no threats found, add some random ones for demo
    if len(threats) == 0:
        num_threats = random.randint(2, 5)
        for _ in range(num_threats):
            threat_type = random.choice(THREAT_TYPES)
            threats.append({
                'type': threat_type,
                'severity': random.choice(SEVERITIES),
                'description': f'Potential {threat_type.replace("_", " ").lower()} activity detected',
                'sourceIP': f'{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}',
                'targetIP': f'10.0.0.{random.randint(1, 255)}',
                'port': random.choice([22, 80, 443, 3306, 5432, 8080, None]),
                'timestamp': datetime.now().isoformat(),
                'confidence': round(random.uniform(0.6, 0.95), 2)
            })
    
    return threats[:10]  # Return max 10 threats

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'service': 'LogIz AI Analysis API',
        'status': 'running',
        'version': '1.0.0',
        'message': 'Mock API - Replace with your trained model'
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Analyze log file content
    
    Expected JSON body:
    {
        "log_content": "string",
        "filename": "string",
        "file_type": "string"
    }
    
    Returns:
    {
        "success": true,
        "threatCount": int,
        "threats": [...],
        "summary": {...},
        "processingTime": int
    }
    """
    try:
        start_time = time.time()
        
        # Get request data
        data = request.json
        log_content = data.get('log_content', '')
        filename = data.get('filename', 'unknown')
        file_type = data.get('file_type', '.txt')
        
        if not log_content:
            return jsonify({
                'success': False,
                'error': 'No log content provided'
            }), 400
        
        print(f"Analyzing {filename} ({len(log_content)} bytes)...")
        
        # Simulate processing time (0.5-2 seconds)
        time.sleep(random.uniform(0.5, 2.0))
        
        # Generate mock threats
        threats = generate_mock_threats(log_content)
        
        # Calculate summary
        summary = {
            'critical': sum(1 for t in threats if t['severity'] == 'CRITICAL'),
            'high': sum(1 for t in threats if t['severity'] == 'HIGH'),
            'medium': sum(1 for t in threats if t['severity'] == 'MEDIUM'),
            'low': sum(1 for t in threats if t['severity'] == 'LOW'),
            'info': sum(1 for t in threats if t['severity'] == 'INFO')
        }
        
        processing_time = int((time.time() - start_time) * 1000)  # milliseconds
        
        response = {
            'success': True,
            'threatCount': len(threats),
            'threats': threats,
            'summary': summary,
            'processingTime': processing_time,
            'metadata': {
                'filename': filename,
                'fileType': file_type,
                'logLines': len(log_content.split('\n')),
                'analyzedAt': datetime.now().isoformat()
            }
        }
        
        print(f"✓ Analysis complete: {len(threats)} threats found in {processing_time}ms")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("LogIz Mock AI Analysis API")
    print("=" * 60)
    print("Starting server on http://localhost:8000")
    print("This is a MOCK API for development/testing")
    print("Replace with your trained AI model for production")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=8000,
        debug=True
    )
