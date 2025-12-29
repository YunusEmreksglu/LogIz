'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Terminal, Download, Shield, Server, CheckCircle, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function AgentsPage() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            fetchKey();
        } else if (status === 'unauthenticated') {
            setError('Lütfen giriş yapın');
            setLoading(false);
        }
    }, [status, session]);

    const fetchKey = async () => {
        try {
            setError(null);
            setLoading(true);

            // Get userId from NextAuth session
            const userId = (session?.user as any)?.id || session?.user?.email;
            if (!userId) {
                setError('Kullanıcı bilgisi alınamadı');
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/agents/key?userId=${encodeURIComponent(userId)}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Sunucu hatası: ${res.status}`);
            }
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            if (data.key) setApiKey(data.key);
            else throw new Error('Anahtar bulunamadı');
        } catch (e: any) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const resetKey = async () => {
        if (!confirm('Eski anahtarınız geçersiz olacak. Emin misiniz?')) return;
        setLoading(true);
        setError(null);
        try {
            const userId = (session?.user as any)?.id || session?.user?.email;
            if (!userId) throw new Error('Kullanıcı bulunamadı');

            const res = await fetch('/api/agents/key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Yenileme hatası: ${res.status}`);
            }
            const data = await res.json();
            if (data.key) setApiKey(data.key);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const serverUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const installCommand = apiKey
        ? `curl -O ${serverUrl}/agent.py && python agent.py ${apiKey} ${serverUrl}`
        : 'Yükleniyor...';

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    Ajan Yönetimi
                </h1>
                <p className="text-gray-400">Sunucularınızı güvenli bir şekilde bağlayın ve izleyin.</p>
            </div>

            {/* API Key Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Shield className="w-8 h-8 text-green-400" />
                        <div>
                            <h2 className="text-xl font-semibold text-white">API Anahtarı</h2>
                            <p className="text-sm text-gray-400">Ajanların verileri göndermesi için gereklidir</p>
                        </div>
                    </div>
                    <button
                        onClick={resetKey}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Yenile
                    </button>
                </div>

                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 blur-xl transition-opacity opacity-50 group-hover:opacity-100" />
                    <div className="relative p-4 bg-black/50 rounded-xl border border-gray-700 flex items-center justify-between font-mono text-lg">
                        {error ? (
                            <span className="text-red-500 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </span>
                        ) : loading ? (
                            <span className="text-gray-400">Yükleniyor...</span>
                        ) : (
                            <span className="text-green-400">{apiKey}</span>
                        )}
                        <button
                            onClick={copyToClipboard}
                            disabled={!apiKey}
                            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                            {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Installation Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <Terminal className="w-6 h-6 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">Linux Kurulumu</h3>
                    </div>
                    <div className="bg-black/50 p-4 rounded-xl border border-gray-700 font-mono text-sm text-gray-300 break-all">
                        {installCommand}
                    </div>
                    <p className="text-xs text-gray-500">
                        * Python 3.x ve requests kütüphanesi gerektirir.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <Server className="w-6 h-6 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">Manuel Kurulum</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            <a href="/agent.py" download className="text-blue-400 hover:underline flex items-center gap-1">
                                agent.py <Download className="w-3 h-3" />
                            </a>
                            dosyasını indirin
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            Scripti systemd servisi olarak ayarlayın
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            API Key'i environment variable olarak verin
                        </li>
                    </ul>
                </motion.div>
            </div>

            {/* How It Works */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-gray-900 border border-gray-800"
            >
                <h3 className="text-lg font-semibold text-white mb-4">Nasıl Çalışır?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-black/30 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-2">1</div>
                        <p className="text-sm text-gray-400">Ajan scripti sunucunuzda çalışır ve log dosyalarını izler</p>
                    </div>
                    <div className="p-4 bg-black/30 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-2">2</div>
                        <p className="text-sm text-gray-400">Loglar API anahtarı ile şifrelenerek bu sunucuya gönderilir</p>
                    </div>
                    <div className="p-4 bg-black/30 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-2">3</div>
                        <p className="text-sm text-gray-400">Canlı İzleme sayfasından anlık olarak takip edebilirsiniz</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
