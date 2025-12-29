module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/fs/promises [external] (fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs/promises", () => require("fs/promises"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[project]/app/api/analyze/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
;
;
;
async function POST(request) {
    try {
        const { logFileId } = await request.json();
        if (!logFileId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Log file ID is required"
            }, {
                status: 400
            });
        }
        // Use Service Role client to bypass RLS for analysis processing
        const { createClient } = await __turbopack_context__.A("[project]/node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs [app-route] (ecmascript, async loader)");
        const supabaseAdmin = createClient(("TURBOPACK compile-time value", "https://tmavagzxznmmwecbudux.supabase.co"), process.env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        const { data: logFile, error: fileError } = await supabaseAdmin.from('log_files').select('*').eq('id', logFileId).single();
        if (fileError || !logFile) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Log file not found"
            }, {
                status: 404
            });
        }
        await supabaseAdmin.from('log_files').update({
            status: "PROCESSING"
        }).eq('id', logFileId);
        const filePath = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(process.cwd(), "public", logFile.file_path);
        // Read file as base64 for Python API
        const fileContentBase64 = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["readFile"])(filePath, "base64");
        const startTime = Date.now();
        let analysisResult;
        try {
            console.log("Sending to Python Backend...");
            const pythonResponse = await fetch('http://127.0.0.1:5000/api/analyze/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
                threats: pythonData.attacks,
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
        } catch (error) {
            console.error("Engine execution failed:", error);
            analysisResult = {
                success: false,
                threatCount: 0,
                threats: [],
                summary: {
                    critical: 0,
                    high: 0,
                    medium: 0,
                    low: 0,
                    info: 0
                },
                processingTime: 0,
                error: error.message || "Analysis failed"
            };
        }
        const processingTime = Date.now() - startTime;
        const analysisId = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])();
        const { data: analysis, error: analysisError } = await supabaseAdmin.from('analyses').insert({
            id: analysisId,
            log_file_id: logFileId,
            user_id: logFile.user_id,
            result: analysisResult,
            threat_count: analysisResult.threatCount,
            high_severity: analysisResult.summary.critical + analysisResult.summary.high,
            medium_severity: analysisResult.summary.medium,
            low_severity: analysisResult.summary.low,
            status: "COMPLETED",
            processing_time: processingTime
        }).select('id, threat_count, processing_time').single();
        if (analysisError || !analysis) {
            throw analysisError || new Error("Failed to save analysis");
        }
        const threatInserts = await Promise.all(analysisResult.threats.map(async (threat)=>{
            // Geolocate IP
            let geoInfo = null;
            try {
                if (threat.sourceIP && threat.sourceIP !== 'N/A') {
                    const geo = __turbopack_context__.r("[project]/node_modules/geoip-lite/lib/geoip.js [app-route] (ecmascript)");
                    // Attempt to look up the IP
                    geoInfo = geo.lookup(threat.sourceIP);
                }
            } catch (geoError) {
            // If geoip fails (e.g. file not found), just ignore it and continue cleanly
            // console.warn("GeoIP lookup failed:", geoError);
            }
            return {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
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
                source_country: geoInfo?.country || null
            };
        }));
        const { data: threats, error: threatError } = await supabaseAdmin.from('threats').insert(threatInserts).select('*');
        if (threatError) {
            console.error("Threat insert error:", threatError);
        // Continue even if logging threats fails, but log it.
        }
        await supabaseAdmin.from('log_files').update({
            status: "COMPLETED"
        }).eq('id', logFileId);
        // Send notifications for critical threats
        try {
            const criticalThreats = analysisResult.threats.filter((t)=>t.severity === 'CRITICAL');
            if (criticalThreats.length > 0) {
                const { sendNotifications } = await __turbopack_context__.A("[project]/lib/notifications.ts [app-route] (ecmascript, async loader)");
                // Get user email if available
                let userEmail = null;
                if (logFile.user_id) {
                    const { data: userData } = await supabaseAdmin.from('users').select('email').eq('id', logFile.user_id).single();
                    userEmail = userData?.email;
                }
                await sendNotifications(analysis.id, analysisResult.threats, {
                    email: userEmail ? {
                        to: userEmail
                    } : undefined,
                    slack: process.env.SLACK_WEBHOOK_URL ? {
                        webhookUrl: process.env.SLACK_WEBHOOK_URL
                    } : undefined
                });
            }
        } catch (notifError) {
            console.error('Notification error:', notifError);
        // Don't fail the request if notifications fail
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
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
                threats: threats?.map((t)=>({
                        ...t,
                        sourceIP: t.source_ip,
                        targetIP: t.target_ip,
                        rawLog: t.raw_log,
                        sourceLat: t.source_lat,
                        sourceLon: t.source_lon,
                        sourceCountry: t.source_country,
                        analysisId: t.analysis_id
                    }))
            }
        });
    } catch (error) {
        console.error("Analysis error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to analyze log file"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b31a791e._.js.map