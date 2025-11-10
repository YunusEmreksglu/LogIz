import { Shield, Lock, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-darker via-cyber-dark to-cyber-darker">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-cyber-blue/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse-slow" />
          <div className="absolute w-96 h-96 bg-cyber-purple/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse-slow" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-6 py-24">
          <nav className="flex items-center justify-between mb-24">
            <div className="flex items-center space-x-2">
              <Shield className="w-10 h-10 text-cyber-blue" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyber-blue to-cyber-purple bg-clip-text text-transparent">
                LogIz
              </span>
            </div>
            <Link 
              href="/upload"
              className="px-6 py-3 bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-lg font-medium text-white hover:shadow-lg hover:shadow-cyber-blue/20 transition-all duration-300"
            >
              Hemen Analiz Yap
            </Link>
          </nav>

          <div className="max-w-4xl mx-auto text-center space-y-8 py-20">
            <div className="inline-block px-4 py-2 bg-cyber-blue/10 border border-cyber-blue/20 rounded-full text-cyber-blue text-sm font-medium mb-4">
              🛡️ UNSW-NB15 Dataset ile Destekleniyor
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight">
              Siber Güvenlik Log Analizi
              <br />
              <span className="bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-blue bg-clip-text text-transparent animate-glow">
                Yapay Zeka ile
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              175.000+ siber saldırı verisi ile eğitilmiş yapay zeka modelimiz, log dosyalarınızı anında analiz eder. 
              Hesap açmadan ücretsiz deneyin!
            </p>

            <div className="flex items-center justify-center gap-4 pt-8">
              <Link
                href="/upload"
                className="group px-8 py-4 bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-xl font-semibold text-white hover:shadow-xl hover:shadow-cyber-blue/30 transition-all duration-300 flex items-center space-x-2"
              >
                <span>Ücretsiz Analiz Yap</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-white border border-gray-700 transition-all duration-300"
              >
                Hesap Oluştur
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 pt-4">
              ✨ Kayıt olmadan analiz yapabilirsiniz • Sonuçları kaydetmek için giriş gereklidir
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">UNSW-NB15 Dataset Özellikleri</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Akademik araştırmalarda kullanılan gerçek siber saldırı verileri ile eğitilmiş yapay zeka
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-cyber-blue/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-cyber-blue/10 flex items-center justify-center mb-6 group-hover:bg-cyber-blue/20 transition-colors">
              <Shield className="w-7 h-7 text-cyber-blue" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">10 Saldırı Türü</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              DoS, Exploits, Backdoor, Shellcode, Worms, Fuzzers, Reconnaissance ve daha fazlası
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-cyber-red/10 text-cyber-red text-xs rounded">CRITICAL</span>
              <span className="px-2 py-1 bg-cyber-yellow/10 text-cyber-yellow text-xs rounded">HIGH</span>
              <span className="px-2 py-1 bg-cyber-blue/10 text-cyber-blue text-xs rounded">MEDIUM</span>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-cyber-purple/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-cyber-purple/10 flex items-center justify-center mb-6 group-hover:bg-cyber-purple/20 transition-colors">
              <Zap className="w-7 h-7 text-cyber-purple" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Anında Sonuç</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Log dosyanızı yükleyin, 175.000+ pattern ile karşılaştırma yapın, saniyeler içinde sonuç alın
            </p>
            <div className="text-2xl font-bold text-cyber-purple">&lt; 5 saniye</div>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 hover:border-cyber-green/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-cyber-green/10 flex items-center justify-center mb-6 group-hover:bg-cyber-green/20 transition-colors">
              <Lock className="w-7 h-7 text-cyber-green" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Ücretsiz Analiz</h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              Hesap açmadan analiz yapın. Sonuçları kaydetmek ve geçmişi görüntülemek için ücretsiz kayıt olun
            </p>
            <div className="text-2xl font-bold text-cyber-green">%100 Ücretsiz</div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-6 py-24">
              {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        <div className="text-center p-6 rounded-xl bg-gray-900/30 border border-gray-800">
          <div className="text-4xl font-bold text-cyber-blue mb-2">175K+</div>
          <div className="text-sm text-gray-400">Eğitim Verisi</div>
        </div>
        <div className="text-center p-6 rounded-xl bg-gray-900/30 border border-gray-800">
          <div className="text-4xl font-bold text-cyber-purple mb-2">&lt;5s</div>
          <div className="text-sm text-gray-400">Analiz Süresi</div>
        </div>
        <div className="text-center p-6 rounded-xl bg-gray-900/30 border border-gray-800">
          <div className="text-4xl font-bold text-cyber-green mb-2">10</div>
          <div className="text-sm text-gray-400">Saldırı Türü</div>
        </div>
        <div className="text-center p-6 rounded-xl bg-gray-900/30 border border-gray-800">
          <div className="text-4xl font-bold text-cyber-yellow mb-2">Ücretsiz</div>
          <div className="text-sm text-gray-400">Analiz</div>
        </div>
      </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>&copy; 2025 LogIz. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
