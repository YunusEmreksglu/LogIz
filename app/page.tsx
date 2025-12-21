'use client'

import { Shield, Lock, Zap, ArrowRight, Play, ChevronDown, Bug, Globe, BarChart3, FileSearch } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FloatingParticles, AnimatedStats, FeatureCard } from '@/components/landing'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030712] overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background Effects */}
        <FloatingParticles />

        {/* Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] -top-48 -left-48" />
          <div className="absolute w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] top-1/2 -right-48" />
          <div className="absolute w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] bottom-0 left-1/3" />
        </div>

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative container mx-auto px-6 py-6"
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="w-10 h-10 text-cyan-400" />
                <div className="absolute inset-0 w-10 h-10 bg-cyan-400/20 rounded-full blur-lg" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                LogIz
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Özellikler</a>
              <a href="#stats" className="text-gray-400 hover:text-white transition-colors">İstatistikler</a>
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">Giriş Yap</Link>
            </div>

            <Link
              href="/upload"
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-medium text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
            >
              Hemen Başla
            </Link>
          </div>
        </motion.nav>

        {/* Hero Content */}
        <div className="relative flex-1 flex items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-8"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>UNSW-NB15 Dataset ile Destekleniyor</span>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
              >
                Siber Güvenlik
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Log Analizi
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
              >
                175.000+ siber saldırı verisi ile eğitilmiş yapay zeka modelimiz,
                log dosyalarınızı anında analiz eder ve tehditleri tespit eder.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  href="/upload"
                  className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-semibold text-white hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  <span>Ücretsiz Analiz Yap</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-8 py-4 bg-gray-800/50 backdrop-blur-sm rounded-xl font-semibold text-white border border-gray-700/50 hover:bg-gray-700/50 transition-all duration-300"
                >
                  <Play className="w-5 h-5" />
                  <span>Demo Görüntüle</span>
                </Link>
              </motion.div>

              {/* Trust Badge */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-sm text-gray-500 mt-8"
              >
                ✨ Kayıt olmadan analiz yapabilirsiniz • Sonuçları kaydetmek için giriş gereklidir
              </motion.p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <a href="#features" className="flex flex-col items-center text-gray-500 hover:text-gray-300 transition-colors">
            <span className="text-sm mb-2">Daha fazla keşfet</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </a>
        </motion.div>
      </div>

      {/* Features Section */}
      <section id="features" className="relative py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Neden LogIz?
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Akademik araştırmalarda kullanılan gerçek siber saldırı verileri ile eğitilmiş yapay zeka
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Shield}
              title="10 Saldırı Türü"
              description="DoS, Exploits, Backdoor, Shellcode, Worms, Fuzzers, Reconnaissance ve daha fazlası"
              color="cyan"
              delay={0}
            />
            <FeatureCard
              icon={Zap}
              title="Anında Sonuç"
              description="Log dosyanızı yükleyin, 175.000+ pattern ile karşılaştırma yapın"
              highlight="< 5 saniye"
              color="purple"
              delay={0.1}
            />
            <FeatureCard
              icon={Lock}
              title="Ücretsiz Analiz"
              description="Hesap açmadan analiz yapın. Sonuçları kaydetmek için ücretsiz kayıt olun"
              highlight="%100 Ücretsiz"
              color="emerald"
              delay={0.2}
            />
            <FeatureCard
              icon={Bug}
              title="Tehdit Tespiti"
              description="Gelişmiş ML algoritmaları ile zararlı trafik paternlerini otomatik tespit"
              color="red"
              delay={0.3}
            />
            <FeatureCard
              icon={Globe}
              title="Global Tehdit Haritası"
              description="Saldırı kaynaklarını dünya haritası üzerinde görselleştirin"
              color="amber"
              delay={0.4}
            />
            <FeatureCard
              icon={BarChart3}
              title="Detaylı Raporlar"
              description="PDF olarak indirilebilir, paylaşılabilir analiz raporları"
              color="purple"
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative py-32 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Rakamlarla LogIz
            </h2>
            <p className="text-gray-300 text-lg">
              Güçlü altyapımız ve eğitim verilerimiz
            </p>
          </motion.div>

          <AnimatedStats />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-cyan-500/10 border border-gray-800/50 p-12 md:p-20 text-center overflow-hidden"
          >
            {/* Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5" />

            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-6">
                Hemen Başlayın
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10">
                Log dosyanızı yükleyin ve saniyeler içinde güvenlik analizi sonuçlarınızı alın.
                Kayıt olmadan ücretsiz deneyin.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/upload"
                  className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-semibold text-white hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  <FileSearch className="w-5 h-5" />
                  <span>Log Dosyası Yükle</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/register"
                  className="px-8 py-4 bg-gray-800/50 backdrop-blur-sm rounded-xl font-semibold text-white border border-gray-700/50 hover:bg-gray-700/50 transition-all duration-300"
                >
                  Ücretsiz Hesap Oluştur
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Shield className="w-6 h-6 text-cyan-400" />
              <span className="text-lg font-bold text-white">LogIz</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 LogIz. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
