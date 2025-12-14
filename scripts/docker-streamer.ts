/**
 * Docker Log Streamer
 * Docker containerlarından canlı log akışı sağlar
 * Kullanım: npx tsx scripts/docker-streamer.ts
 */

import Docker from 'dockerode';
import http from 'http';

// Konfigürasyon
const API_HOST = 'localhost';
const API_PORT = 3000;  // Next.js port
const API_PATH = '/api/live-stream';

// Renk yardımcıları
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

/**
 * Log'u Next.js API'ye gönder
 */
const sendLog = (containerName: string, message: string) => {
    const cleanMessage = message.trim();
    if (!cleanMessage) return;

    const logEntry = {
        message: `[${containerName}] ${cleanMessage}`,
        source: `Docker: ${containerName}`,
        ip: '127.0.0.1',
        timestamp: new Date().toISOString(),
        container: containerName
    };

    const data = JSON.stringify(logEntry);

    const options = {
        hostname: API_HOST,
        port: API_PORT,
        path: API_PATH,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        // Sessiz başarı
    });

    req.on('error', (error) => {
        // Sessiz hata (spam önlemek için)
    });

    req.write(data);
    req.end();

    // Konsol çıktısı
    const preview = cleanMessage.substring(0, 100);
    console.log(`${colors.cyan}[${containerName}]${colors.reset} ${preview}${cleanMessage.length > 100 ? '...' : ''}`);
};

/**
 * Container loglarını izle
 */
const tailContainer = async (container: Docker.ContainerInfo, docker: Docker) => {
    const containerInstance = docker.getContainer(container.Id);
    const name = container.Names[0].replace('/', '');

    console.log(`${colors.green}🔌 Bağlanılıyor: ${name}${colors.reset}`);

    try {
        const stream = await containerInstance.logs({
            follow: true,
            stdout: true,
            stderr: true,
            tail: 10 // Son 10 satırla başla
        });

        stream.on('data', (chunk: Buffer) => {
            // Docker log stream'lerinde header var, temizle
            let text = chunk.toString('utf8');

            // Satır satır işle
            const lines = text.split('\n');
            lines.forEach(line => {
                // Non-printable karakterleri temizle
                // eslint-disable-next-line no-control-regex
                const cleanLine = line.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '');
                sendLog(name, cleanLine);
            });
        });

        stream.on('end', () => {
            console.log(`${colors.yellow}⚠️ Stream sonlandı: ${name}${colors.reset}`);
        });

    } catch (err: any) {
        console.error(`${colors.red}❌ Hata (${name}): ${err.message}${colors.reset}`);
    }
};

/**
 * Ana fonksiyon
 */
const main = async () => {
    console.log(`${colors.blue}🚀 Docker Log Streamer Başlatılıyor${colors.reset}`);
    console.log(`Hedef: http://${API_HOST}:${API_PORT}${API_PATH}`);

    // Windows için Docker pipe, Linux/Mac için socket
    const socketPath = process.platform === 'win32'
        ? '//./pipe/docker_engine'
        : '/var/run/docker.sock';

    const docker = new Docker({ socketPath });

    try {
        const containers = await docker.listContainers();

        if (containers.length === 0) {
            console.log(`${colors.yellow}⚠️ Çalışan container bulunamadı.${colors.reset}`);
            return;
        }

        console.log(`${colors.green}✅ ${containers.length} container bulundu.${colors.reset}`);

        containers.forEach(c => {
            console.log(`   - ${c.Names[0].replace('/', '')} (${c.Image})`);
        });

        console.log('\n');

        // Tüm containerlara bağlan
        containers.forEach(container => tailContainer(container, docker));

    } catch (err: any) {
        console.error(`${colors.red}❌ Docker bağlantısı başarısız.${colors.reset}`);
        console.error(err.message);
        console.log(`${colors.yellow}Docker Desktop'ın çalıştığından emin olun.${colors.reset}`);
    }
};

main();
