module.exports = [
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/dns [external] (dns, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("dns", () => require("dns"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[project]/lib/notifications.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendNotifications",
    ()=>sendNotifications
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nodemailer$2f$lib$2f$nodemailer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nodemailer/lib/nodemailer.js [app-route] (ecmascript)");
;
async function sendNotifications(analysisId, threats, config) {
    const criticalThreats = threats.filter((t)=>t.severity === 'CRITICAL');
    if (criticalThreats.length === 0) {
        return;
    }
    console.log(`[Notifications] Found ${criticalThreats.length} critical threats. Sending alerts...`);
    // Send Email
    if (config.email && process.env.SMTP_HOST) {
        try {
            await sendEmail(analysisId, criticalThreats, config.email.to);
        } catch (error) {
            console.error('[Notifications] Failed to send email:', error);
        }
    }
    // Send Slack
    if (config.slack && process.env.SLACK_WEBHOOK_URL) {
        try {
            await sendSlack(analysisId, criticalThreats, process.env.SLACK_WEBHOOK_URL);
        } catch (error) {
            console.error('[Notifications] Failed to send Slack message:', error);
        }
    }
}
async function sendEmail(analysisId, threats, to) {
    const transporter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nodemailer$2f$lib$2f$nodemailer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    const html = `
    <h1>🚨 Critical Security Alert</h1>
    <p>LogIz detected <strong>${threats.length}</strong> critical threats in analysis <code>${analysisId}</code>.</p>
    
    <h2>Threat Details:</h2>
    <ul>
      ${threats.map((t)=>`
        <li>
          <strong>${t.type}</strong>: ${t.description} <br/>
          Source IP: ${t.sourceIP || 'N/A'}
        </li>
      `).join('')}
    </ul>
    
    <p><a href="${process.env.NEXTAUTH_URL}/history">View Full Report</a></p>
  `;
    await transporter.sendMail({
        from: '"LogIz Security" <noreply@logiz.com>',
        to,
        subject: `[CRITICAL] ${threats.length} Threats Detected - LogIz`,
        html
    });
    console.log('[Notifications] Email sent successfully');
}
async function sendSlack(analysisId, threats, webhookUrl) {
    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "🚨 Critical Security Alert",
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `LogIz detected *${threats.length}* critical threats in analysis \`${analysisId}\`.`
            }
        },
        {
            type: "divider"
        },
        ...threats.slice(0, 5).map((t)=>({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*${t.type}*\n${t.description}\nSource IP: \`${t.sourceIP || 'N/A'}\``
                }
            })),
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `<${process.env.NEXTAUTH_URL}/history|View Full Report>`
            }
        }
    ];
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            blocks
        })
    });
    if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
    }
    console.log('[Notifications] Slack message sent successfully');
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9b1af53a._.js.map