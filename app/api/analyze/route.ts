import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { supabase } from "@/lib/supabase";
import { analyzeLog } from "@/lib/analysis-engine";

export async function POST(request: NextRequest) {
  try {
    const { logFileId } = await request.json();

    if (!logFileId) {
      return NextResponse.json({ error: "Log file ID is required" }, { status: 400 });
    }

    const { data: logFile, error: fileError } = await supabase
      .from('log_files')
      .select('*')
      .eq('id', logFileId)
      .single();

    if (fileError || !logFile) {
      return NextResponse.json({ error: "Log file not found" }, { status: 404 });
    }

    await supabase
      .from('log_files')
      .update({ status: "PROCESSING" })
      .eq('id', logFileId);

    const filePath = join(process.cwd(), "public", logFile.filePath);
    const fileContent = await readFile(filePath, "utf-8");

    const startTime = Date.now();
    let analysisResult;

    try {
      // Use the new Pure TypeScript Analysis Engine
      analysisResult = await analyzeLog({
        logContent: fileContent,
        filename: logFile.originalName,
        fileType: logFile.fileType,
      });
    } catch (error) {
      console.error("Engine execution failed:", error);
      analysisResult = {
        success: false,
        threatCount: 0,
        threats: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        processingTime: 0,
        error: "Analysis failed"
      };
    }

    const processingTime = Date.now() - startTime;

    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        logFileId,
        result: analysisResult,
        threatCount: analysisResult.threatCount,
        highSeverity: analysisResult.summary.critical + analysisResult.summary.high,
        mediumSeverity: analysisResult.summary.medium,
        lowSeverity: analysisResult.summary.low,
        status: "COMPLETED",
        processingTime,
      })
      .select('id, threatCount, processingTime')
      .single();

    if (analysisError || !analysis) {
      throw analysisError || new Error("Failed to save analysis");
    }

    const threatInserts = await Promise.all(
      analysisResult.threats.map(async (threat: any) => {
        // Geolocate IP
        let geoInfo = null
        if (threat.sourceIP && threat.sourceIP !== 'N/A') {
          const geo = require('geoip-lite')
          geoInfo = geo.lookup(threat.sourceIP)
        }

        return {
          analysisId: analysis.id,
          type: threat.type,
          severity: threat.severity,
          description: threat.description,
          sourceIP: threat.sourceIP,
          targetIP: threat.targetIP,
          port: threat.port,
          timestamp: threat.timestamp ? new Date(threat.timestamp).toISOString() : null,
          rawLog: threat.rawLog,
          confidence: threat.confidence,
          // Geolocation data
          sourceLat: geoInfo?.ll?.[0] || null,
          sourceLon: geoInfo?.ll?.[1] || null,
          sourceCountry: geoInfo?.country || null,
        }
      })
    );

    const { data: threats, error: threatError } = await supabase
      .from('threats')
      .insert(threatInserts)
      .select('*');

    if (threatError) {
      console.error("Threat insert error:", threatError);
      // Continue even if logging threats fails, but log it.
    }

    await supabase
      .from('log_files')
      .update({ status: "COMPLETED" })
      .eq('id', logFileId);

    // Send notifications for critical threats
    try {
      const criticalThreats = analysisResult.threats.filter((t: any) => t.severity === 'CRITICAL')
      if (criticalThreats.length > 0) {
        const { sendNotifications } = await import('@/lib/notifications')

        // Get user email if available
        let userEmail = null;
        if (logFile.userId) {
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', logFile.userId)
            .single();
          userEmail = userData?.email;
        }

        await sendNotifications(analysis.id, analysisResult.threats, {
          email: userEmail ? { to: userEmail } : undefined,
          slack: process.env.SLACK_WEBHOOK_URL ? { webhookUrl: process.env.SLACK_WEBHOOK_URL } : undefined
        })
      }
    } catch (notifError) {
      console.error('Notification error:', notifError)
      // Don't fail the request if notifications fail
    }

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
