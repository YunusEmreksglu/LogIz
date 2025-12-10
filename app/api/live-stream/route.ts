// app/api/live-stream/route.ts

let clients: WritableStreamDefaultWriter<any>[] = [];

export async function GET() {
  // SSE bağlantı yarat
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Yeni client ekle
  clients.push(writer);

  // Bağlantı açılır açılmaz ilk mesaj
  writer.write(`data: "connected"\n\n`);

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: Request) {
  const { message, source, ip } = await req.json();

  const log = {
    id: crypto.randomUUID(),
    message,
    source,
    ip,
    timestamp: new Date(),
  };

  console.log("🔥 NEW LIVE LOG:", log);

  // Tüm bağlı clientlara gönder
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
