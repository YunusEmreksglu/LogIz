/**
 * Live Stream API Endpoint
 * Docker ve diğer kaynaklardan gelen logları SSE ile frontend'e iletir
 * 
 * GET: SSE bağlantısı oluştur (client connect)
 * POST: Log gönder (tüm bağlı clientlara broadcast)
 */

import { NextRequest } from 'next/server'

// Bağlı client'ları tut
const clients: Set<WritableStreamDefaultWriter<any>> = new Set()

export async function GET(request: NextRequest) {
    // SSE stream oluştur
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Client'ı listeye ekle
    clients.add(writer)

    // Bağlantı onay mesajı
    const encoder = new TextEncoder()
    writer.write(encoder.encode(`data: "connected"\n\n`))

    console.log(`📡 Live stream client bağlandı. Toplam: ${clients.size}`)

    // Client disconnect olduğunda temizle
    request.signal.addEventListener('abort', () => {
        clients.delete(writer)
        console.log(`📡 Live stream client ayrıldı. Toplam: ${clients.size}`)
        try {
            writer.close()
        } catch (e) {
            // Zaten kapalı olabilir
        }
    })

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const { message, source, ip, container, timestamp } = body

        const log = {
            id: crypto.randomUUID(),
            message: message || '',
            source: source || 'Unknown',
            ip: ip || '127.0.0.1',
            container: container || null,
            timestamp: timestamp || new Date().toISOString(),
            receivedAt: new Date().toISOString()
        }

        console.log(`🔥 NEW LIVE LOG: ${log.source} - ${log.message.substring(0, 50)}...`)

        // Tüm bağlı client'lara gönder
        const encoder = new TextEncoder()
        const data = `data: ${JSON.stringify(log)}\n\n`

        const deadClients: WritableStreamDefaultWriter<any>[] = []

        for (const client of clients) {
            try {
                await client.write(encoder.encode(data))
            } catch (e) {
                // Bağlantı kopmuş, temizlenecek listeye ekle
                deadClients.push(client)
            }
        }

        // Kopmuş bağlantıları temizle
        deadClients.forEach(client => clients.delete(client))

        return Response.json({
            success: true,
            delivered: clients.size,
            log: log
        })

    } catch (error: any) {
        console.error('Live stream POST error:', error)
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
