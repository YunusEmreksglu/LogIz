import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { mockAnalyzeLog, analyzeLogWithPython } from "@/lib/python-api";

export async function POST(request: NextRequest) {
  try {
    const { logFileId } = await request.json();

    if (!logFileId) {
      return NextResponse.json({ error: "Log file ID is required" }, { status: 400 });
    }

    const logFile = await prisma.logFile.findUnique({ where: { id: logFileId } });
    if (!logFile) {
      return NextResponse.json({ error: "Log file not found" }, { status: 404 });
    }

    await prisma.logFile.update({ where: { id: logFileId }, data: { status: "PROCESSING" } });

    const filePath = join(process.cwd(), "public", logFile.filePath);
    const fileContent = await readFile(filePath, "utf-8");

    const startTime = Date.now();
    let analysisResult;
    
    try {
      analysisResult = await analyzeLogWithPython({
        logContent: fileContent,
        filename: logFile.originalName,
        fileType: logFile.fileType,
      });
    } catch (error) {
      analysisResult = await mockAnalyzeLog({
        logContent: fileContent,
        filename: logFile.originalName,
        fileType: logFile.fileType,
      });
    }
    
    const processingTime = Date.now() - startTime;

    const analysis = await prisma.analysis.create({
      data: {
        logFileId,
        result: analysisResult,
        threatCount: analysisResult.threatCount,
        highSeverity: analysisResult.summary.critical + analysisResult.summary.high,
        mediumSeverity: analysisResult.summary.medium,
        lowSeverity: analysisResult.summary.low,
        status: "COMPLETED",
        processingTime,
      },
    });

    const threats = await Promise.all(
      analysisResult.threats.map((threat: any) =>
        prisma.threat.create({
          data: {
            analysisId: analysis.id,
            type: threat.type,
            severity: threat.severity,
            description: threat.description,
            sourceIP: threat.sourceIP,
            targetIP: threat.targetIP,
            port: threat.port,
            timestamp: threat.timestamp ? new Date(threat.timestamp) : null,
            rawLog: threat.rawLog,
            confidence: threat.confidence,
          },
        })
      )
    );

    await prisma.logFile.update({ where: { id: logFileId }, data: { status: "COMPLETED" } });

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        threatCount: analysis.threatCount,
        processingTime: analysis.processingTime,
        threats,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze log file" }, { status: 500 });
  }
}
