
export interface AnalysisRequest {
    logContent: string;
    filename: string;
    fileType: string;
}

export interface ThreatDetection {
    type: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
    description: string;
    sourceIP?: string;
    targetIP?: string;
    port?: number;
    timestamp?: string;
    rawLog?: string;
    confidence?: number;
}

export interface AnalysisResponse {
    success: boolean;
    threatCount: number;
    threats: ThreatDetection[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    processingTime: number;
    error?: string;
}

// Rule-based Analysis Engine
export async function analyzeLog(data: AnalysisRequest): Promise<AnalysisResponse> {
    const startTime = Date.now();
    const threats: ThreatDetection[] = [];
    const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

    try {
        const lines = data.logContent.split(/\r?\n/);
        // Basic CSV parsing - assumes header is first line
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Helper to get value safely
        const getValue = (row: string[], field: string) => {
            const index = headers.findIndex(h => h.includes(field));
            return index !== -1 ? row[index]?.trim() : null;
        };

        // Limit analysis to first 5000 lines to prevent timeouts on large files in pure JS
        const maxLines = Math.min(lines.length, 5000);

        for (let i = 1; i < maxLines; i++) {
            if (!lines[i].trim()) continue;

            const row = lines[i].split(','); // Simple split, might need regex for complex CSVs
            if (row.length < headers.length * 0.5) continue; // Skip malformed lines

            const srcIp = getValue(row, 'srcip') || getValue(row, 'source') || 'N/A';
            const dstIp = getValue(row, 'dstip') || getValue(row, 'dest') || 'N/A';
            const portStr = getValue(row, 'dsport') || getValue(row, 'port') || getValue(row, 'sport') || '0';
            const port = parseInt(portStr);
            const proto = getValue(row, 'proto') || 'TCP';
            const service = getValue(row, 'service') || '-';
            const state = getValue(row, 'state') || '-';

            // Attack Detection Logic
            let detected = false;
            let severity: ThreatDetection['severity'] = 'INFO';
            let type = 'ANOMALY';
            let description = '';

            // Rule 1: Known Bad Ports
            const dangerousPorts = [23, 445, 3389, 6667];
            if (dangerousPorts.includes(port)) {
                detected = true;
                severity = 'MEDIUM';
                type = 'SUSPICIOUS_PORT';
                description = `Traffic on prohibited port ${port} (${service})`;
            }

            // Rule 2: High/Ephemeral Ports Scanning
            if (port > 1024 && port < 60000 && state === 'INT') {
                detected = true;
                severity = 'LOW';
                type = 'PORT_SCAN';
                description = `Potential port scan activity detected on ${port}`;
            }

            // Rule 3: Database Injection Attempts (Heuristic)
            // Check entire row for SQL keywords
            const rowStr = lines[i].toLowerCase();
            if (rowStr.includes('select') && (rowStr.includes('union') || rowStr.includes('from') || rowStr.includes('drop'))) {
                detected = true;
                severity = 'CRITICAL';
                type = 'SQL_INJECTION';
                description = 'Potential SQL Injection payload detected';
            }

            // Rule 4: Brute Force Indicators
            // (Simplified state check)
            if (service === 'ssh' && state === 'CON') {
                // In a real stream we'd count frequency, here just flagging connection attempts
                detected = true;
                severity = 'HIGH';
                type = 'BRUTE_FORCE_ATTEMPT';
                description = 'SSH connection attempt detected (Potential Brute Force)';
            }

            if (detected) {
                summary[severity.toLowerCase() as keyof typeof summary]++;

                // Collect first 50 threats to avoid overwhelming UI
                if (threats.length < 50) {
                    threats.push({
                        type,
                        severity,
                        description,
                        sourceIP: srcIp,
                        targetIP: dstIp,
                        port,
                        timestamp: new Date().toISOString(),
                        rawLog: lines[i].substring(0, 200), // logging first 200 chars
                        confidence: 0.85
                    });
                }
            }
        }

        return {
            success: true,
            threatCount: threats.length,
            threats,
            summary,
            processingTime: Date.now() - startTime
        };

    } catch (error: any) {
        console.error("Analysis Error:", error);
        return {
            success: false,
            threatCount: 0,
            threats: [],
            summary,
            processingTime: Date.now() - startTime,
            error: error.message || 'Unknown analysis error'
        };
    }
}
