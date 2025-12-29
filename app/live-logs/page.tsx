'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Trash2, Filter, AlertTriangle, Shield, Activity, Wifi, WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Severity tipleri
type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

interface LogEvent {
  id: string;
  timestamp: Date;
  raw: string;
  severity: Severity;
  description: string;
  source_ip: string | null;
  username: string | null;
}

// Severity renk konfigürasyonu
const severityConfig = {
  CRITICAL: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]' },
  HIGH:     { bg: 'bg-orange-500/10', border: 'border-orange-500/50', text: 'text-orange-400', glow: 'shadow-[0_0_10px_rgba(249,115,22,0.3)]' },
  MEDIUM:   { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: '' },
  LOW:      { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-400', glow: '' },
  INFO:     { bg: 'bg-gray-500/10', border: 'border-gray-500/50', text: 'text-gray-400', glow: '' },
};

// Mesajdan severity üretme
function detectSeverity(message: string): Severity {
  const lower = message.toLowerCase();
  if (lower.includes("failed password")) return "HIGH";
  if (lower.includes("invalid user")) return "MEDIUM";
  if (lower.includes("accepted password")) return "LOW";
  if (lower.includes("error") || lower.includes("denied")) return "CRITICAL";
  return "INFO";
}

// 🔥 RENKLENDİRME (Highlight)
function highlightLog(text: string) {
  if (!text) return "";
  return text
    .replace(/failed password/gi, `<span class="text-red-400 font-semibold">Failed password</span>`)
    .replace(/invalid user/gi, `<span class="text-orange-400 font-semibold">Invalid user</span>`)
    .replace(/accepted password/gi, `<span class="text-green-400 font-semibold">Accepted password</span>`)
    .replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, `<span class="text-blue-400 font-semibold">$&</span>`)
    .replace(/\buser\b/gi, `<span class="text-purple-400 font-semibold">user</span>`);
}

// 🔥 IP → Ülke + Bayrak
async function fetchIpInfo(ip: string) {
  if (!ip) return null;
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    return {
      country: data.country_name || "Unknown",
      flag: data.country_code ? `https://flagcdn.com/24x18/${data.country_code.toLowerCase()}.png` : null,
    };
  } catch {
    return null;
  }
}

export default function LiveMonitoringPage() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [filter, setFilter] = useState<Severity | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [ipCache, setIpCache] = useState<Record<string, any>>({});

  const eventSourceRef = useRef<EventSource | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0
  });

  // SSE Başlat
  useEffect(() => {
    const es = new EventSource('/api/live-stream');
    eventSourceRef.current = es;

    es.onopen = () => setIsStreaming(true);
    es.onerror = () => setIsStreaming(false);

    es.onmessage = async (event) => {
      if (event.data === "connected") return;

      const incoming = JSON.parse(event.data);
      const severity = detectSeverity(incoming.message);

      let ipData = null;
      if (incoming.ip) {
        if (!ipCache[incoming.ip]) {
          ipData = await fetchIpInfo(incoming.ip);
          setIpCache(prev => ({ ...prev, [incoming.ip]: ipData }));
        } else {
          ipData = ipCache[incoming.ip];
        }
      }

      const newLog: LogEvent = {
        id: incoming.id,
        timestamp: new Date(incoming.timestamp),
        raw: incoming.message,
        severity,
        description: incoming.message,
        username: incoming?.username || null,
        source_ip: incoming?.ip || null,
      };

      setLogs(prev => [newLog, ...prev].slice(0, 500));

      // İstatistik güncelle
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        critical: prev.critical + (severity === "CRITICAL" ? 1 : 0),
        high: prev.high + (severity === "HIGH" ? 1 : 0),
        medium: prev.medium + (severity === "MEDIUM" ? 1 : 0),
        low: prev.low + (severity === "LOW" ? 1 : 0),
        info: prev.info + (severity === "INFO" ? 1 : 0),
      }));
    };

    return () => es.close();
  }, []);

  // 🔎 Arama + Filtre
  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (
      (filter === "ALL" || log.severity === filter) &&
      (
        log.raw.toLowerCase().includes(q) ||
        (log.username?.toLowerCase().includes(q)) ||
        (log.source_ip?.includes(q))
      )
    );
  });

  // Logs temizle
  const clearLogs = () => {
    setLogs([]);
    setStats({ total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 });
  };

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Radio className="w-6 h-6 text-red-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Canlı Log İzleme</h1>
            <p className="text-sm text-gray-400">Gerçek zamanlı güvenlik logları</p>
          </div>

          <div className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2",
            isStreaming ? "bg-emerald-500/10 text-emerald-400" :
              "bg-red-500/10 text-red-400"
          )}>
            {isStreaming ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isStreaming ? "CANLI" : "KAPALI"}</span>
          </div>
        </div>

        <button
          onClick={clearLogs}
          className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600"
        >
          <Trash2 className="w-4 h-4 inline mr-2" />
          Temizle
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Ara (IP, kullanıcı, mesaj...)"
        className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { key: "total", label: "Toplam", color: "white" },
          { key: "critical", label: "Kritik", color: "red" },
          { key: "high", label: "Yüksek", color: "orange" },
          { key: "medium", label: "Orta", color: "yellow" },
          { key: "low", label: "Düşük", color: "blue" },
          { key: "info", label: "Bilgi", color: "gray" }
        ].map(item => (
          <motion.div key={item.key} className="p-4 rounded-xl bg-gray-900 border border-gray-700">
            <span className="text-xs text-gray-400">{item.label}</span>
            <p className={`text-2xl font-bold text-${item.color}-400`}>
              {stats[item.key as keyof typeof stats]}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Logs */}
      <div
        ref={logsRef}
        className="h-[500px] overflow-y-auto rounded-2xl bg-gray-900 border border-gray-700 p-4 space-y-2"
      >
        <AnimatePresence>
          {filteredLogs.map(log => {
            const config = severityConfig[log.severity];
            const ipInfo = log.source_ip ? ipCache[log.source_ip] : null;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn("p-4 rounded-xl border-l-4", config.bg, config.border, config.glow)}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <span className={cn("px-2 py-1 text-xs rounded", config.text)}>
                    {log.severity}
                  </span>
                  <span className="text-xs text-gray-500">
                    {log.timestamp.toLocaleTimeString("tr-TR")}
                  </span>
                </div>

                {/* RENKLENDİRİLMİŞ LOG */}
                <p
                  className="text-gray-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlightLog(log.raw) }}
                />

                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                  {/* IP + BAYRAK + ÜLKE */}
                  {log.source_ip && (
                    <span className="flex items-center space-x-2">
                      <span className="text-gray-500">IP:</span>
                      <span className="text-blue-400">{log.source_ip}</span>

                      {ipInfo?.flag && (
                        <img src={ipInfo.flag} className="w-5 h-4 rounded border border-gray-700" />
                      )}
                      {ipInfo?.country && <span>{ipInfo.country}</span>}
                    </span>
                  )}

                  {log.username && (
                    <span>
                      <span className="text-gray-500">Kullanıcı:</span>{" "}
                      <span className="text-purple-400">{log.username}</span>
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Shield className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-400">Eşleşen log bulunamadı</p>
            <p className="text-sm text-gray-500">Başka bir arama deneyin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
