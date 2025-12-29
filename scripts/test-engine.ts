
import { analyzeLog } from '../lib/analysis-engine';
import * as fs from 'fs';
import * as path from 'path';

async function test() {
    console.log("Testing Pure TS Analysis Engine...");

    const sampleLogPath = path.join(process.cwd(), 'sample_data', 'sample_log.txt');

    if (!fs.existsSync(sampleLogPath)) {
        console.error("Sample log not found:", sampleLogPath);
        return;
    }

    const content = fs.readFileSync(sampleLogPath, 'utf-8');

    console.log(`Analyzing ${content.length} bytes...`);

    const result = await analyzeLog({
        logContent: content,
        filename: 'sample_log.txt',
        fileType: '.txt'
    });

    console.log("Analysis Result:");
    console.log(JSON.stringify(result, null, 2));
}

test();
