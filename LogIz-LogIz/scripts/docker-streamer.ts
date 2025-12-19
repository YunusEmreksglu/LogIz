import Docker from 'dockerode';
import http from 'http';

// Configuration
const API_HOST = 'localhost';
const API_PORT = 3000;
const API_PATH = '/api/live-stream';

// Color helper
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const sendLog = (containerName: string, message: string) => {
    const cleanMessage = message.trim();
    if (!cleanMessage) return;

    const logEntry = {
        message: `[${containerName}] ${cleanMessage}`,
        source: `Docker: ${containerName}`,
        ip: '127.0.0.1',
        timestamp: new Date().toISOString()
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
        // Silent success, maybe debug logging if needed
        // if (res.statusCode !== 200) console.error(`Failed to send log: ${res.statusCode}`);
    });

    req.on('error', (error) => {
        // Silent fail to avoid spam
        // console.error(`Error sending log: ${error.message}`);
    });

    req.write(data);
    req.end();

    // Console feedback
    console.log(`${colors.cyan}[${containerName}]${colors.reset} ${cleanMessage.substring(0, 100)}${cleanMessage.length > 100 ? '...' : ''}`);
};

const tailContainer = async (container: Docker.ContainerInfo, docker: Docker) => {
    const containerInstance = docker.getContainer(container.Id);
    const name = container.Names[0].replace('/', '');

    console.log(`${colors.green}🔌 Attaching to ${name}${colors.reset}`);

    try {
        const stream = await containerInstance.logs({
            follow: true,
            stdout: true,
            stderr: true,
            tail: 10 // Start with last 10 lines
        });

        stream.on('data', (chunk: Buffer) => {
            // Docker log streams have a header. 
            // First 8 bytes are header: [StreamType (1), 0, 0, 0, SIZE (4 bytes)]
            // We essentially just convert buffer to string and try to clean it up.
            // A more robust parser would check the header bytes.

            // Simple decode
            let text = chunk.toString('utf8');

            // Often chunks contain mixed binary headers if multiple frames come at once
            // Regex to strip control characters can be aggressive, let's just send strictly printable or simple clean
            // Actually, for live streaming raw text, simple toString often suffices visually, 
            // but dockerode might pass raw multiplexed stream. 
            // Dockerode 'logs' with 'follow' usually returns a ReadableStream.
            // Let's strip the first 8 bytes if it looks like a single frame, but streaming implies continuous data.
            // To be safe, we just send the text, the UI handles some messiness.

            // Attempt to clean known docker header garbage characters if they appear at start
            // Note: This is a simplification.

            // Split by newline in case of multiple lines
            const lines = text.split('\n');
            lines.forEach(line => {
                // Remove non-printable chars roughly (control chars except newline/tab)
                // eslint-disable-next-line no-control-regex
                const cleanLine = line.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '');
                sendLog(name, cleanLine);
            });
        });

        stream.on('end', () => {
            console.log(`${colors.yellow}⚠️ Stream ended for ${name}${colors.reset}`);
        });

    } catch (err: any) {
        console.error(`${colors.red}❌ Error tailing ${name}: ${err.message}${colors.reset}`);
    }
};

const main = async () => {
    console.log(`${colors.blue}🚀 Starting Docker Log Streamer (TS)${colors.reset}`);
    console.log(`Target: http://${API_HOST}:${API_PORT}${API_PATH}`);

    const docker = new Docker({ socketPath: '//./pipe/docker_engine' }); // Windows pipe default

    try {
        const containers = await docker.listContainers();

        if (containers.length === 0) {
            console.log(`${colors.yellow}⚠️ No running containers found.${colors.reset}`);
            return;
        }

        console.log(`${colors.green}✅ Found ${containers.length} containers.${colors.reset}`);

        containers.forEach(container => tailContainer(container, docker));

    } catch (err: any) {
        console.error(`${colors.red}❌ Failed to connect to Docker.${colors.reset}`);
        console.error(err.message);
        console.log(`${colors.yellow}Make sure Docker Desktop is running.${colors.reset}`);
    }
};

main();
