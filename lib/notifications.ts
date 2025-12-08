import nodemailer from 'nodemailer'

interface Threat {
    type: string
    severity: string
    description: string
    sourceIP?: string
}

interface NotificationConfig {
    email?: {
        to: string
    }
    slack?: {
        webhookUrl: string
    }
}

export async function sendNotifications(
    analysisId: string,
    threats: Threat[],
    config: NotificationConfig
) {
    const criticalThreats = threats.filter(t => t.severity === 'CRITICAL')

    if (criticalThreats.length === 0) {
        return
    }

    console.log(`[Notifications] Found ${criticalThreats.length} critical threats. Sending alerts...`)

    // Send Email
    if (config.email && process.env.SMTP_HOST) {
        try {
            await sendEmail(analysisId, criticalThreats, config.email.to)
        } catch (error) {
            console.error('[Notifications] Failed to send email:', error)
        }
    }

    // Send Slack
    if (config.slack && process.env.SLACK_WEBHOOK_URL) {
        try {
            await sendSlack(analysisId, criticalThreats, process.env.SLACK_WEBHOOK_URL)
        } catch (error) {
            console.error('[Notifications] Failed to send Slack message:', error)
        }
    }
}

async function sendEmail(analysisId: string, threats: Threat[], to: string) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })

    const html = `
    <h1>🚨 Critical Security Alert</h1>
    <p>LogIz detected <strong>${threats.length}</strong> critical threats in analysis <code>${analysisId}</code>.</p>
    
    <h2>Threat Details:</h2>
    <ul>
      ${threats.map(t => `
        <li>
          <strong>${t.type}</strong>: ${t.description} <br/>
          Source IP: ${t.sourceIP || 'N/A'}
        </li>
      `).join('')}
    </ul>
    
    <p><a href="${process.env.NEXTAUTH_URL}/history">View Full Report</a></p>
  `

    await transporter.sendMail({
        from: '"LogIz Security" <noreply@logiz.com>',
        to,
        subject: `[CRITICAL] ${threats.length} Threats Detected - LogIz`,
        html,
    })

    console.log('[Notifications] Email sent successfully')
}

async function sendSlack(analysisId: string, threats: Threat[], webhookUrl: string) {
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
        ...threats.slice(0, 5).map(t => ({
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
    ]

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
    })

    if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`)
    }

    console.log('[Notifications] Slack message sent successfully')
}
