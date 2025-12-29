// scripts/ssh-monitor.js
const { Client } = require('ssh2');

const SSH_CONFIG = {
    host: process.env.SSH_HOST || 'localhost',
    port: parseInt(process.env.SSH_PORT || '22'),
    username: process.env.SSH_USER || 'root',
    password: process.env.SSH_PASSWORD,
    privateKey: process.env.SSH_KEY_PATH ? require('fs').readFileSync(process.env.SSH_KEY_PATH) : undefined,
};

const LOG_API_URL = process.env.LOG_API_URL || 'http://localhost:3000/api/live-stream';

// Threat Patterns (Partial list ported from Python)
const PATTERNS = [
    { name: 'BRUTE_FORCE', regex: /Failed password|Failed publickey|authentication failure.*rhost=/, severity: 'HIGH' },
    { name: 'ROOT_LOGIN', regex: /Accepted.*for root|session opened.*root/, severity: 'CRITICAL' },
    { name: 'LOGIN_SUCCESS', regex: /Accepted password|Accepted publickey/, severity: 'INFO' },
    { name: 'SESSION_OPENED', regex: /session opened|New session/, severity: 'INFO' },
    { name: 'INVALID_USER', regex: /Invalid user|user unknown/, severity: 'HIGH' },
];

function startMonitor() {
    const conn = new Client();

    conn.on('ready', () => {
        console.log('✅ SSH Connection established');

        conn.exec('tail -f /var/log/auth.log', (err, stream) => {
            if (err) throw err;

            stream.on('close', (code, signal) => {
                console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
                conn.end();
            }).on('data', (data) => {
                const lines = data.toString().split('\n');
                lines.forEach(line => {
                    if (!line.trim()) return;

                    // Basic Analysis
                    let severity = 'INFO';
                    let threat = null;

                    for (const p of PATTERNS) {
                        if (p.regex.test(line)) {
                            severity = p.severity;
                            threat = p.name;
                            break;
                        }
                    }

                    // Extract IP
                    const ipMatch = line.match(/from\s+(\d+\.\d+\.\d+\.\d+)|rhost=(\d+\.\d+\.\d+\.\d+)/);
                    const ip = ipMatch ? (ipMatch[1] || ipMatch[2]) : 'Unknown';

                    // Send to API
                    const payload = {
                        message: line.trim(),
                        source: 'ssh-monitor',
                        ip: ip,
                        severity: severity,
                        threat: threat
                    };

                    fetch(LOG_API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }).catch(e => console.error('API Error:', e.message));

                    console.log(`[${severity}] ${line.substring(0, 50)}...`);
                });
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    }).on('error', (err) => {
        console.error('SSH Connection Error:', err.message);
        setTimeout(startMonitor, 5000); // Reconnect logic
    }).connect(SSH_CONFIG);
}

if (require.main === module) {
    if (!SSH_CONFIG.username || (!SSH_CONFIG.password && !SSH_CONFIG.privateKey)) {
        console.error('❌ Missing SSH credentials in env variables (SSH_USER, SSH_PASSWORD/SSH_KEY_PATH)');
        process.exit(1);
    }
    console.log('🚀 Starting SSH Monitor...');
    startMonitor();
}
