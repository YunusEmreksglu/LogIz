import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = await request.json();

  // EventSource’a yollamak için SSE endpointine postla:
  await fetch("http://localhost:3000/api/live-stream", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return NextResponse.json({ ok: true });
}
