'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import FileUpload from '@/components/FileUpload'
import AnalysisProgress from '@/components/AnalysisProgress'
import { CheckCircle, Loader, AlertCircle, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UploadPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError('')

    try {
      // Upload file
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const uploadData = await uploadResponse.json()

      // Start analysis
      setUploading(false)
      setAnalyzing(true)

      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logFileId: uploadData.logFile.id }),
      })

      if (!analyzeResponse.ok) {
        throw new Error('Analysis failed')
      }

      const analyzeData = await analyzeResponse.json()
      setResult(analyzeData.analysis)
      setAnalyzing(false)

    } catch (err) {
      console.error('Upload/Analysis error:', err)
      setError('Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.')
      setUploading(false)
      setAnalyzing(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Log Dosyası Analizi</h1>
          <p className="text-gray-400">
            UNSW-NB15 veri seti ile log dosyanızı ücretsiz analiz edin
          </p>
          {!session && (
            <div className="mt-4 p-4 bg-cyber-blue/10 border border-cyber-blue/20 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-cyber-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-cyber-blue font-medium">Giriş yapmadan analiz yapabilirsiniz!</p>
                <p className="text-xs text-gray-400 mt-1">
                  Ancak analiz sonuçlarını kaydetmek ve geçmişi görüntülemek için{' '}
                  <Link href="/login" className="text-cyber-blue hover:underline">giriş yapın</Link>
                  {' '}veya{' '}
                  <Link href="/register" className="text-cyber-blue hover:underline">hesap oluşturun</Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Component - Hide while analyzing */}
        {!analyzing && !result && <FileUpload onUpload={handleUpload} />}

        {/* Error Message */}
        {error && (
          <div className="mt-8 p-6 rounded-xl bg-cyber-red/10 border border-cyber-red/20">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-cyber-red flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-cyber-red mb-2">Hata Oluştu</h3>
                <p className="text-sm text-gray-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Status */}
        {analyzing && (
          <AnalysisProgress />
        )}

        {/* Success Result */}
        {result && (
          <div className="mt-8 space-y-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-cyber-green/10 to-cyber-green/5 border border-cyber-green/20">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-cyber-green flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Analiz Tamamlandı!
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-400">Tespit Edilen Tehdit:</span>
                      <span className="ml-2 text-white font-semibold">{result.threatCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">İşlem Süresi:</span>
                      <span className="ml-2 text-white font-semibold">
                        {(result.processingTime / 1000).toFixed(2)}s
                      </span>
                    </div>
                  </div>

                  {!session && (
                    <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                      <div className="flex items-center space-x-3 mb-3">
                        <LogIn className="w-5 h-5 text-cyber-blue" />
                        <p className="text-sm font-medium text-white">Bu sonuçları kaydetmek ister misiniz?</p>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        Giriş yaparak tüm analiz geçmişinize erişebilir, detaylı raporlar görüntüleyebilirsiniz
                      </p>
                      <div className="flex gap-3">
                        <Link
                          href="/register"
                          className="px-4 py-2 bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-lg text-sm font-medium text-white hover:shadow-lg transition-all"
                        >
                          Hesap Oluştur
                        </Link>
                        <Link
                          href="/login"
                          className="px-4 py-2 bg-gray-800 rounded-lg text-sm font-medium text-white hover:bg-gray-700 transition-all"
                        >
                          Giriş Yap
                        </Link>
                      </div>
                    </div>
                  )}

                  {result.threats && result.threats.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Tespit Edilen Tehditler:</h4>
                      <div className="space-y-2">
                        {result.threats.slice(0, 3).map((threat: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-white">{threat.type}</span>
                              <span className={`text-xs px-2 py-1 rounded ${threat.severity === 'CRITICAL' ? 'bg-cyber-red/20 text-cyber-red' :
                                threat.severity === 'HIGH' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
                                  'bg-cyber-blue/20 text-cyber-blue'
                                }`}>
                                {threat.severity}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">{threat.description}</p>
                            {threat.sourceIP && (
                              <p className="text-xs text-gray-500 mt-1">Kaynak IP: {threat.sourceIP}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-700">
            <div className="text-3xl font-bold text-cyber-blue mb-2">50MB</div>
            <p className="text-sm text-gray-400">Maksimum dosya boyutu</p>
          </div>
          <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-700">
            <div className="text-3xl font-bold text-cyber-purple mb-2">&lt;5s</div>
            <p className="text-sm text-gray-400">Ortalama analiz süresi</p>
          </div>
          <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-700">
            <div className="text-3xl font-bold text-cyber-green mb-2">10+</div>
            <p className="text-sm text-gray-400">Saldırı türü tespiti</p>
          </div>
        </div>
      </div>
    </div>
  )
}
