import { NextRequest, NextResponse } from "next/server";
import { readFile, appendFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { analyzeLogWithPython } from "@/lib/python-api";

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
    } catch (error: any) {
      const errorMsg = `[${new Date().toISOString()}] Python Analysis Failed: ${error.message}\n`
      console.error(errorMsg)
      try {
        await appendFile(join(process.cwd(), 'analysis_error.log'), errorMsg)
      } catch (e) { console.error(e) }

      throw error // Re-throw to be caught by outer handler
    }

    const processingTime = Date.now() - startTime;
    let savedAnalysis = null;
    let savedThreats = [];

    // Veritabanına kaydetme işlemi (Opsiyonel - Hata olursa analizi engellememeli)
    try {
      const analysis = await prisma.analysis.create({
        data: {
          logFileId,
          result: JSON.parse(JSON.stringify(analysisResult)) as any,
          threatCount: analysisResult.threatCount,
          highSeverity: analysisResult.summary.critical + analysisResult.summary.high,
          mediumSeverity: analysisResult.summary.medium,
          lowSeverity: analysisResult.summary.low,
          status: "COMPLETED",
          processingTime,
        },
      });
      savedAnalysis = analysis;

      const threats = await Promise.all(
        analysisResult.threats.map((threat: any) => {
          // Geolocate IP
          let geoInfo = null
          if (threat.sourceIP && threat.sourceIP !== 'N/A') {
            try {
              const geo = require('geoip-lite')
              geoInfo = geo.lookup(threat.sourceIP)
            } catch (e) {
              console.warn('GeoIP lookup failed:', e)
            }
          }

          return prisma.threat.create({
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
              // Geolocation data
              sourceLat: geoInfo?.ll?.[0] || null,
              sourceLon: geoInfo?.ll?.[1] || null,
              sourceCountry: geoInfo?.country || null,
            },
          })
        })
      );
      savedThreats = threats;

      await prisma.logFile.update({ where: { id: logFileId }, data: { status: "COMPLETED" } });

      // Send notifications for critical threats
      try {
        const criticalThreats = analysisResult.threats.filter((t: any) => t.severity === 'CRITICAL')
        if (criticalThreats.length > 0) {
          const { sendNotifications } = await import('@/lib/notifications')

          // Get user email if available
          const user = logFile.userId ? await prisma.user.findUnique({ where: { id: logFile.userId } }) : null

          await sendNotifications(analysis.id, analysisResult.threats, {
            email: user?.email ? { to: user.email } : undefined,
            slack: process.env.SLACK_WEBHOOK_URL ? { webhookUrl: process.env.SLACK_WEBHOOK_URL } : undefined
          })
        }
      } catch (notifError) {
        console.error('Notification error:', notifError)
      }

    } catch (dbError: any) {
      console.error("Database save failed:", dbError);
      const dbErrorMsg = `[${new Date().toISOString()}] Database Save Error: ${dbError.message}\n`
      try {
        await appendFile(join(process.cwd(), 'database_error.log'), dbErrorMsg)
      } catch (e) { }

      // Veritabanı hatası olsa bile kullanıcıya sonucu göster
      // Frontend için geçici ID ve yapı oluştur
      savedAnalysis = {
        id: 'temp-' + Date.now(),
        threatCount: analysisResult.threatCount,
        processingTime,
      };
      savedThreats = analysisResult.threats;
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: savedAnalysis?.id,
        threatCount: savedAnalysis?.threatCount || analysisResult.threatCount,
        processingTime: savedAnalysis?.processingTime || processingTime,
        threats: savedThreats.length > 0 ? savedThreats : analysisResult.threats,
        savedToDb: !!savedAnalysis?.id && !savedAnalysis.id.toString().startsWith('temp-'),
        // Pass through Python API's full classification data
        severity_summary: (analysisResult as any).severity_summary || analysisResult.summary,
        attack_type_distribution: (analysisResult as any).attack_type_distribution || {},
      },
    });
  } catch (error: any) {
    const errorMsg = `[${new Date().toISOString()}] Analysis Route Error: ${error.message}\nStack: ${error.stack}\n`;
    console.error(errorMsg);
    try {
      await appendFile(join(process.cwd(), 'analysis_error.log'), errorMsg);
    } catch (logErr) {
      console.error('Failed to write analysis log:', logErr);
    }

    return NextResponse.json({ error: "Failed to analyze log file", details: error.message }, { status: 500 });
  }
}
