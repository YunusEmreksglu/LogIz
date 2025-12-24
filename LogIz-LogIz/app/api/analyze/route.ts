import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { supabase } from "@/lib/supabase";
import { analyzeLog } from "@/lib/analysis-engine";

export async function POST(request: NextRequest) {
  try {
    const { logFileId } = await request.json();

    if (!logFileId) {
      return NextResponse.json({ error: "Log file ID is required" }, { status: 400 });
    }

    // Use Service Role client to bypass RLS for analysis processing
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: logFile, error: fileError } = await supabaseAdmin
      .from('log_files')
      .select('*')
      .eq('id', logFileId)
      .single();

    if (fileError || !logFile) {
      return NextResponse.json({ error: "Log file not found" }, { status: 404 });
    }

    await supabaseAdmin
      .from('log_files')
      .update({ status: "PROCESSING" })
      .eq('id', logFileId);

    const filePath = join(process.cwd(), "public", logFile.file_path);
    // Read file as base64 for Python API
    const fileContentBase64 = await readFile(filePath, "base64");

    const startTime = Date.now();
    let analysisResult;

    try {
      console.log("Sending to Python Backend...");
      const pythonResponse = await fetch('http://127.0.0.1:5000/api/analyze/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: logFile.original_name,
          file_content: fileContentBase64
        })
      });

      if (!pythonResponse.ok) {
        const errText = await pythonResponse.text();
        throw new Error(`Python API Failed: ${pythonResponse.status} - ${errText}`);
      }

      const pythonData = await pythonResponse.json();
      console.log("Python Analysis Complete:", pythonData.success);

      // Map Python response to internal format
      analysisResult = {
        success: pythonData.success,
        threatCount: pythonData.results.attacks_detected,
        threats: pythonData.attacks, // Types match mostly
        summary: {
          critical: pythonData.severity_summary?.CRITICAL || 0,
          high: pythonData.severity_summary?.HIGH || 0,
          medium: pythonData.severity_summary?.MEDIUM || 0,
          low: pythonData.severity_summary?.LOW || 0,
          info: pythonData.severity_summary?.INFO || 0
        },
        processingTime: (pythonData.results.prediction_time_seconds || 0) * 1000,
        // Extra metadata
        totalLogLines: pythonData.results.total_records,
        attack_type_distribution: pythonData.attack_type_distribution
      };

    } catch (error: any) {
      console.error("Engine execution failed:", error);
      analysisResult = {
        success: false,
        threatCount: 0,
        threats: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        processingTime: 0,
        error: error.message || "Analysis failed"
      };
    }

    const processingTime = Date.now() - startTime;

    const analysisId = randomUUID();

    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .insert({
        id: analysisId,
        log_file_id: logFileId,
        user_id: logFile.user_id, // Link analysis to user directly
        result: analysisResult,
        threat_count: analysisResult.threatCount,
        high_severity: analysisResult.summary.critical + analysisResult.summary.high,
        medium_severity: analysisResult.summary.medium,
        low_severity: analysisResult.summary.low,
        status: "COMPLETED",
        processing_time: processingTime,
      })
      .select('id, threat_count, processing_time')
      .single();

    if (analysisError || !analysis) {
      throw analysisError || new Error("Failed to save analysis");
    }

    const threatInserts = await Promise.all(
      analysisResult.threats.map(async (threat: any) => {
        // Geolocate IP
        let geoInfo = null
        try {
          if (threat.sourceIP && threat.sourceIP !== 'N/A') {
            const geo = require('geoip-lite')
            // Attempt to look up the IP
            geoInfo = geo.lookup(threat.sourceIP)
          }
        } catch (geoError) {
          // If geoip fails (e.g. file not found), just ignore it and continue cleanly
          // console.warn("GeoIP lookup failed:", geoError);
        }

        return {
          id: randomUUID(),
          analysis_id: analysis.id,
          type: threat.type,
          severity: threat.severity,
          description: threat.description,
          source_ip: threat.sourceIP,
          target_ip: threat.targetIP,
          port: threat.port,
          timestamp: threat.timestamp ? new Date(threat.timestamp).toISOString() : null,
          raw_log: threat.rawLog,
          confidence: threat.confidence,
          // Geolocation data
          source_lat: geoInfo?.ll?.[0] || null,
          source_lon: geoInfo?.ll?.[1] || null,
          source_country: geoInfo?.country || null,
        }
      })
    );

    const { data: threats, error: threatError } = await supabaseAdmin
      .from('threats')
      .insert(threatInserts)
      .select('*');

    if (threatError) {
      console.error("Threat insert error:", threatError);
      // Continue even if logging threats fails, but log it.
    }

    await supabaseAdmin
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
        if (logFile.user_id) {
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', logFile.user_id)
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
        threatCount: analysis.threat_count,
        processingTime: analysis.processing_time,
        severity_summary: {
          CRITICAL: analysisResult.summary.critical,
          HIGH: analysisResult.summary.high,
          MEDIUM: analysisResult.summary.medium,
          LOW: analysisResult.summary.low,
          INFO: analysisResult.summary.info
        },
        attack_type_distribution: analysisResult.attack_type_distribution || {},
        threats: threats?.map((t: any) => ({
          ...t,
          sourceIP: t.source_ip,
          targetIP: t.target_ip,
          rawLog: t.raw_log,
          sourceLat: t.source_lat,
          sourceLon: t.source_lon,
          sourceCountry: t.source_country,
          analysisId: t.analysis_id
        })),
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze log file" }, { status: 500 });
  }
}
