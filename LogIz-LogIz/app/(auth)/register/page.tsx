'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, Mail, Lock, User, Loader, AlertCircle, CheckCircle, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { FloatingParticles } from '@/components/landing'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Kayıt başarısız')
        setLoading(false)
        return
      }

      setSuccess(true)

      // Auto login after registration
      setTimeout(async () => {
        await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })
        router.push('/dashboard')
      }, 1500)
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 overflow-hidden">
      {/* Background Effects */}
      <FloatingParticles />

      {/* Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -top-48 -right-48" />
        <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -bottom-48 -left-48" />
        <div className="absolute w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center mb-8"
        >
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="w-12 h-12 text-purple-400" />
              <div className="absolute inset-0 w-12 h-12 bg-purple-400/20 rounded-full blur-lg" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              LogIz
            </span>
          </Link>
        </motion.div>

        {/* Register Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Hesap Oluştur</h1>
            <p className="text-gray-400">LogIz güvenlik platformuna katılın</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start space-x-3"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-emerald-400 font-medium">Hesap başarıyla oluşturuldu!</p>
                <p className="text-xs text-gray-400 mt-1">Dashboard'a yönlendiriliyorsunuz...</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Ad Soyad
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="Adınız Soyadınız"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Adresi
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Şifre
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">En az 6 karakter</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Şifre Tekrar
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || success}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Hesap oluşturuluyor...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Hesap oluşturuldu!</span>
                </>
              ) : (
                <>
                  <span>Hesap Oluştur</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Zaten hesabınız var mı?{' '}
              <Link
                href="/login"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Giriş Yap
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center space-x-1"
          >
            <span>←</span>
            <span>Ana Sayfaya Dön</span>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
