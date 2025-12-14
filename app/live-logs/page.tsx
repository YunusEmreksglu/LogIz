"use client";

import { useEffect, useState } from "react";

export default function LiveLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const ev = new EventSource("/api/live-stream");

    ev.onmessage = (event) => {
      if (event.data === "connected" || event.data === '"connected"') return;
      try {
        const log = JSON.parse(event.data);

        // If log is just a string (e.g. "connected" parsed as json), ignore it or handle differently
        if (typeof log !== 'object' || log === null) return;

        // Ensure ID exists
        if (!log.id) {
          log.id = crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}-${Math.random()}`;
        }

        setLogs((prev) => {
          // Prevent duplicates
          if (prev.some((l) => l.id === log.id)) return prev;
          return [log, ...prev].slice(0, 200);
        });
      } catch (e) {
        console.error("Failed to parse log", e);
      }
    };

    return () => ev.close();
  }, []);

  const getColor = (msg: string) => {
    if (/failed|error|denied/i.test(msg)) return "border-red-500 text-red-400 shadow-[0_0_8px_#ff000055]";
    if (/accepted|success/i.test(msg)) return "border-green-500 text-green-400 shadow-[0_0_8px_#00ff0055]";
    if (/warning|invalid/i.test(msg)) return "border-yellow-400 text-yellow-300 shadow-[0_0_8px_#ffff0055]";
    return "border-blue-400 text-blue-300 shadow-[0_0_8px_#00aaff55]";
  };

  return (
    <div className="min-h-screen bg-black text-white relative">

      {/* CYBER GRID */}
      <div className="absolute inset-0 opacity-10 pointer-events-none 
        bg-[linear-gradient(#0ff_1px,transparent_1px),linear-gradient(90deg,#0ff_1px,transparent_1px)]
        bg-[size:40px_40px]">
      </div>

      <div className="relative p-6">
        <h1 className="text-4xl font-bold mb-6 text-cyan-400 drop-shadow-[0_0_12px_#00eaff]">
          🔴 Live Cybersecurity Log Stream
        </h1>

        <div className="
          bg-[#0f0f0f]/80 border border-cyan-400/40 rounded-lg p-4 h-[75vh] overflow-auto
          shadow-[0_0_15px_#00eaff55]
        ">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`
                p-3 mb-3 rounded bg-black/40 border-l-4 transition-all
                ${getColor(log.message)}
              `}
            >
              <div className="flex justify-between text-xs opacity-70 mb-1">
                <span>{log.ip}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>

              <p className="text-sm">{log.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
