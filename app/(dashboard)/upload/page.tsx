'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Zap,
  Target,
  AlertTriangle,
  FileWarning,
  ArrowRight,
  LogIn
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function UploadPage() {
  const { data: session } = useSession()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setError('')
      setResult(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.log', '.txt'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  })

  const handleAnalyze = async () => {
    if (!file) return

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      // Upload file
      const formData = new FormData()
      formData.append('file', file)

      setProgress(20)
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        console.error('Upload failed:', uploadResponse.status, errorData)
        throw new Error(errorData.error || errorData.details || `Dosya yüklenemedi (${uploadResponse.status})`)
      }

      const uploadData = await uploadResponse.json()
      setProgress(40)
      setUploading(false)
      setAnalyzing(true)

      // Analyze
      setProgress(60)
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logFileId: uploadData.logFile.id }),
      })

      if (!analyzeResponse.ok) {
        throw new Error('Analiz başarısız')
      }

      setProgress(100)
      const analyzeData = await analyzeResponse.json()
      setResult(analyzeData.analysis)
      setAnalyzing(false)

    } catch (err: any) {
      console.error('Upload/Analysis error:', err)
      setError(err.message || 'Bir hata oluştu')
      setUploading(false)
      setAnalyzing(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setResult(null)
    setError('')
    setProgress(0)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
            <Upload className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Log Dosyası Analizi</h1>
            <p className="text-sm text-gray-400">UNSW-NB15 veri seti ile AI destekli tehdit analizi</p>
          </div>
        </div>

        {!session && (
          <Link
            href="/login"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-all border border-cyan-500/30"
          >
            <LogIn className="w-4 h-4" />
            <span>Giriş Yap</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Upload */}
        <div className="lg:col-span-2 space-y-6">
          {/* Drop Zone */}
          {!result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                className={cn(
                  "p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer",
                  isDragActive
                    ? "border-cyan-500 bg-cyan-500/10"
                    : file
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                )}
                {...getRootProps()}
              >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  {file ? (
                    <>
                      <div className="p-4 rounded-xl bg-emerald-500/10">
                        <FileText className="w-10 h-10 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white">{file.name}</p>
                        <p className="text-sm text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); resetUpload(); }}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        Farklı dosya seç
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-xl bg-gray-800/50">
                        <Upload className={cn(
                          "w-10 h-10 transition-colors",
                          isDragActive ? "text-cyan-400" : "text-gray-500"
                        )} />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-white">
                          {isDragActive ? "Dosyayı bırakın..." : "Log dosyanızı sürükleyin"}
                        </p>
                        <p className="text-sm text-gray-400">
                          veya <span className="text-cyan-400">gözat</span> (.log, .txt, .csv, .json)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Analyze Button */}
          {file && !result && !analyzing && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleAnalyze}
              disabled={uploading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <span className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Yükleniyor...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Analiz Et</span>
                </span>
              )}
            </motion.button>
          )}

          {/* Progress */}
          {(uploading || analyzing) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-gray-900/50 border border-gray-700/50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">
                  {uploading ? 'Dosya yükleniyor...' : 'AI Analizi yapılıyor...'}
                </span>
                <span className="text-cyan-400 font-mono">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>
                  {analyzing ? 'ML modeli tehditleri analiz ediyor...' : 'Dosya sunucuya aktarılıyor...'}
                </span>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30"
            >
              <div className="flex items-start space-x-4">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-400">Hata Oluştu</h3>
                  <p className="text-sm text-gray-300 mt-1">{error}</p>
                  <button
                    onClick={resetUpload}
                    className="mt-3 text-sm text-cyan-400 hover:underline"
                  >
                    Tekrar dene
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Summary Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 rounded-xl bg-emerald-500/20">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Analiz Tamamlandı!</h3>
                      <p className="text-sm text-gray-400">
                        İşlem süresi: {(result.processingTime / 1000).toFixed(2)}s
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-gray-900/50">
                      <p className="text-2xl font-bold text-white">{result.threatCount}</p>
                      <p className="text-xs text-gray-400">Toplam Tehdit</p>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/10">
                      <p className="text-2xl font-bold text-red-400">
                        {result.severity_summary?.CRITICAL || 0}
                      </p>
                      <p className="text-xs text-gray-400">Kritik</p>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-500/10">
                      <p className="text-2xl font-bold text-orange-400">
                        {result.severity_summary?.HIGH || 0}
                      </p>
                      <p className="text-xs text-gray-400">Yüksek</p>
                    </div>
                    <div className="p-4 rounded-xl bg-yellow-500/10">
                      <p className="text-2xl font-bold text-yellow-400">
                        {result.severity_summary?.MEDIUM || 0}
                      </p>
                      <p className="text-xs text-gray-400">Orta</p>
                    </div>
                  </div>
                </div>

                {/* Tehdit Türü Dağılımı */}
                {result.attack_type_distribution && Object.keys(result.attack_type_distribution).length > 0 && (
                  <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-700/50">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <Target className="w-5 h-5 text-purple-400" />
                      <span>Tehdit Türü Dağılımı</span>
                      <span className="text-sm text-gray-500 font-normal">({result.threatCount} toplam)</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(result.attack_type_distribution)
                        .sort((a: any, b: any) => b[1] - a[1])
                        .map(([type, count]: [string, any]) => {
                          const percentage = ((count / result.threatCount) * 100).toFixed(1)
                          const colors: Record<string, string> = {
                            'Backdoor': 'from-red-500/20 to-red-600/10 border-red-500/30',
                            'Shellcode': 'from-red-500/20 to-orange-500/10 border-red-500/30',
                            'Worms': 'from-red-500/20 to-pink-500/10 border-red-500/30',
                            'Exploits': 'from-orange-500/20 to-red-500/10 border-orange-500/30',
                            'DoS': 'from-orange-500/20 to-yellow-500/10 border-orange-500/30',
                            'Reconnaissance': 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30',
                            'Generic': 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
                            'Fuzzers': 'from-purple-500/20 to-blue-500/10 border-purple-500/30',
                            'Analysis': 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
                            'Normal': 'from-emerald-500/20 to-green-500/10 border-emerald-500/30',
                          }
                          const colorClass = colors[type] || 'from-gray-500/20 to-gray-600/10 border-gray-500/30'

                          return (
                            <motion.div
                              key={type}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`p-4 rounded-xl bg-gradient-to-br ${colorClass} border`}
                            >
                              <p className="text-lg font-bold text-white">{count.toLocaleString()}</p>
                              <p className="text-xs text-gray-300 font-medium truncate">{type}</p>
                              <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-white/30 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
                            </motion.div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Threats List */}
                {result.threats && result.threats.length > 0 && (
                  <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-700/50">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                      <span>Tespit Edilen Tehditler</span>
                    </h4>
                    <div className="space-y-3">
                      {result.threats.map((threat: any, idx: number) => (
                        <motion.div
                          key={threat.recordId || idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="p-4 rounded-xl bg-gray-800/50 border-l-4"
                          style={{
                            borderColor: threat.severity === 'CRITICAL' ? '#ef4444' :
                              threat.severity === 'HIGH' ? '#f97316' :
                                threat.severity === 'MEDIUM' ? '#eab308' : '#3b82f6'
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-white">
                                  {threat.type?.replace(/_/g, ' ')}
                                </span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-xs font-medium border",
                                  getSeverityColor(threat.severity)
                                )}>
                                  {threat.severity}
                                </span>
                                {threat.protocol && threat.protocol !== 'Unknown' && (
                                  <span className="px-2 py-0.5 rounded text-xs bg-gray-700/50 text-gray-300">
                                    {threat.protocol.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mb-2">
                                {threat.description}
                              </p>

                              {/* Ek Detaylar */}
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                                {threat.service && threat.service !== '-' && (
                                  <span className="flex items-center space-x-1">
                                    <span>Servis:</span>
                                    <span className="text-gray-400">{threat.service}</span>
                                  </span>
                                )}
                                {threat.totalBytes > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <span>Veri:</span>
                                    <span className="text-gray-400 font-mono">
                                      {threat.totalBytes > 1000
                                        ? `${(threat.totalBytes / 1000).toFixed(1)} KB`
                                        : `${threat.totalBytes} B`}
                                    </span>
                                  </span>
                                )}
                                {threat.duration > 0 && (
                                  <span className="flex items-center space-x-1">
                                    <span>Süre:</span>
                                    <span className="text-gray-400 font-mono">{threat.duration.toFixed(2)}s</span>
                                  </span>
                                )}
                                {threat.recordId && (
                                  <span className="flex items-center space-x-1">
                                    <span>ID:</span>
                                    <span className="text-gray-400 font-mono">#{threat.recordId}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={resetUpload}
                    className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition-all"
                  >
                    Yeni Analiz
                  </button>
                  <Link
                    href="/history"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium text-center hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Geçmişi Gör</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          {/* Features */}
          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Özellikler</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Hızlı Analiz</p>
                  <p className="text-xs text-gray-400">Ortalama 3-5 saniye</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">AI Destekli</p>
                  <p className="text-xs text-gray-400">UNSW-NB15 ile eğitilmiş</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">10+ Saldırı Türü</p>
                  <p className="text-xs text-gray-400">DoS, Backdoor, Exploit...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-700/50">
              <p className="text-2xl font-bold text-cyan-400">50MB</p>
              <p className="text-xs text-gray-400">Maksimum dosya</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-700/50">
              <p className="text-2xl font-bold text-purple-400">&lt;5s</p>
              <p className="text-xs text-gray-400">Ortalama süre</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-700/50">
              <p className="text-2xl font-bold text-emerald-400">%95+</p>
              <p className="text-xs text-gray-400">Doğruluk oranı</p>
            </div>
          </div>

          {/* Supported Formats */}
          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <FileWarning className="w-5 h-5 text-gray-400" />
              <span>Desteklenen Formatlar</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {['.log', '.txt', '.csv', '.json'].map(ext => (
                <span
                  key={ext}
                  className="px-3 py-1 rounded-lg bg-gray-800 text-sm text-gray-300 font-mono"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
