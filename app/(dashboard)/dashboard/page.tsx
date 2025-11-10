'use client'

import { useEffect, useState } from 'react'
import StatsCard from '@/components/StatsCard'
import ThreatCard from '@/components/ThreatCard'
import { FileText, AlertTriangle, Shield, Activity } from 'lucide-react'
import { DashboardStats, Threat } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLogs: 0,
    totalThreats: 0,
    criticalThreats: 0,
    recentAnalyses: 0,
  })
  const [recentThreats, setRecentThreats] = useState<Threat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()
      setStats(data)
      
      // Mock recent threats for demo
      setRecentThreats([
        {
          id: '1',
          type: 'SQL_INJECTION',
          severity: 'CRITICAL',
          description: 'SQL injection attempt detected in login form',
          sourceIP: '192.168.1.100',
          confidence: 0.95,
          analysisId: '1',
        },
        {
          id: '2',
          type: 'BRUTE_FORCE',
          severity: 'HIGH',
          description: 'Multiple failed login attempts from same IP',
          sourceIP: '203.0.113.45',
          confidence: 0.87,
          analysisId: '1',
        },
      ])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back! Here&apos;s your security overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Logs"
            value={stats.totalLogs}
            icon={<FileText className="w-6 h-6" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Total Threats"
            value={stats.totalThreats}
            icon={<AlertTriangle className="w-6 h-6" />}
            trend={{ value: 8, isPositive: false }}
            className="border-cyber-red/20"
          />
          <StatsCard
            title="Critical Threats"
            value={stats.criticalThreats}
            icon={<Shield className="w-6 h-6" />}
            className="border-cyber-yellow/20"
          />
          <StatsCard
            title="Recent Analyses"
            value={stats.recentAnalyses}
            icon={<Activity className="w-6 h-6" />}
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        {/* Recent Threats */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Threats</h2>
            <button className="text-sm text-cyber-blue hover:text-cyber-blue/80 transition-colors">
              View All →
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : recentThreats.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No threats detected yet</p>
              <p className="text-sm text-gray-500 mt-2">Upload a log file to start analysis</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recentThreats.map((threat) => (
                <ThreatCard key={threat.id} threat={threat} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="/upload"
            className="group p-6 rounded-xl bg-gradient-to-br from-cyber-blue/10 to-cyber-blue/5 border border-cyber-blue/20 hover:border-cyber-blue/50 transition-all duration-300"
          >
            <FileText className="w-8 h-8 text-cyber-blue mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Upload New Log</h3>
            <p className="text-sm text-gray-400">
              Analyze a new log file for security threats
            </p>
          </a>

          <a
            href="/history"
            className="group p-6 rounded-xl bg-gradient-to-br from-cyber-purple/10 to-cyber-purple/5 border border-cyber-purple/20 hover:border-cyber-purple/50 transition-all duration-300"
          >
            <Activity className="w-8 h-8 text-cyber-purple mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">View History</h3>
            <p className="text-sm text-gray-400">
              Browse previous analysis results
            </p>
          </a>
        </div>
      </div>
    </div>
  )
}
