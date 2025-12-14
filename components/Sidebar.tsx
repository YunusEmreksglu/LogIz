'use client'

import { Shield, Upload, Activity, AlertTriangle, Menu, User, LogOut, LayoutDashboard, FileText, Search, Bug, ShieldOff, Radio, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from './ThemeToggle'

// Navigation with categories
const navigationGroups = [
  {
    category: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Canlı İzleme', href: '/live', icon: Radio },
    ]
  },
  {
    category: 'ANALYTICS',
    items: [
      { name: 'Categories', href: '/categories', icon: Activity },
      { name: 'Attack Types', href: '/attack-types', icon: Bug },
    ]
  },
  {
    category: 'SECURITY',
    items: [
      { name: 'Threat Events', href: '/threats', icon: AlertTriangle },
      { name: 'Blocked Traffic', href: '/blocked', icon: ShieldOff },
    ]
  },
  {
    category: 'DATA',
    items: [
      { name: 'Log Explorer', href: '/logs', icon: Search },
      { name: 'Upload Log', href: '/upload', icon: Upload },
      { name: 'History', href: '/history', icon: FileText },
    ]
  },
  {
    category: 'SYSTEM',
    items: [
      { name: 'Ayarlar', href: '/settings', icon: Settings },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen bg-[#0d1117] border-r border-gray-800/50 transition-all duration-300 z-50 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800/50">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-cyan-400" />
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  LogIz
                </span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.category}>
            {/* Category Label */}
            {!isCollapsed && (
              <div className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                {group.category}
              </div>
            )}

            {/* Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : "text-gray-400 hover:bg-gray-800/50 hover:text-white border border-transparent"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-sm font-medium"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Status Indicator */}
      <div className="p-4 border-t border-gray-800/50">
        <div className={cn(
          "flex items-center space-x-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10",
          isCollapsed && "justify-center"
        )}>
          <div className="relative flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-sm font-medium text-emerald-400">System Online</div>
                <div className="text-xs text-gray-500">Collecting logs...</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Theme Toggle & User Section */}
      <div className="p-4 border-t border-gray-800/50 space-y-4">
        {/* Theme Toggle */}
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <span className="text-xs text-gray-500 uppercase tracking-wider">Theme</span>
          )}
          <ThemeToggle />
        </div>

        {/* User */}
        {session?.user ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium text-white truncate">
                      {session.user.name || session.user.email}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className={cn(
              "flex items-center justify-center space-x-2 px-3 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-sm text-white font-medium hover:shadow-lg hover:shadow-cyan-500/20 transition-all",
              isCollapsed && "p-2.5"
            )}
          >
            <User className="w-4 h-4" />
            {!isCollapsed && <span>Sign In</span>}
          </Link>
        )}
      </div>
    </div>
  )
}
