
const fs = require('fs');
const http = require('http');
const path = require('path');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

function uploadFile() {
    const filePath = path.join(__dirname, 'unsw_sample.csv');
    const fileContent = fs.readFileSync(filePath);

    const postDataStart = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="unsw_sample.csv"\r\n` +
        `Content-Type: text/csv\r\n\r\n`
    );

    const postDataEnd = Buffer.from(`\r\n--${boundary}--\r\n`);

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/upload',
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': postDataStart.length + fileContent.length + postDataEnd.length
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Upload Response:', data);
            try {
                const json = JSON.parse(data);
                if (json.logFile && json.logFile.id) {
                    analyzeFile(json.logFile.id);
                }
            } catch (e) {
                console.error('Failed to parse upload response');
            }
        });
    });

    req.write(postDataStart);
    req.write(fileContent);
    req.write(postDataEnd);
    req.end();
}

function analyzeFile(logFileId) {
    const postData = JSON.stringify({ logFileId });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/analyze',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('Analyze Response:', data);
        });
    });

    req.write(postData);
    req.end();
}

uploadFile();
