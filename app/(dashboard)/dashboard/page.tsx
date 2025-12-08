'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import StatsCard from '@/components/StatsCard'
import ThreatCard from '@/components/ThreatCard'
import { FileText, AlertTriangle, Shield, Activity, ShieldAlert, ShieldCheck } from 'lucide-react'
import { DashboardStats, Threat } from '@/types'

import ThreatsOverTimeChart from '@/components/charts/ThreatsOverTimeChart'
import ThreatDistributionChart from '@/components/charts/ThreatDistributionChart'
import SeverityHeatmap from '@/components/charts/SeverityHeatmap'

const ThreatMap = dynamic(() => import('@/components/ThreatMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-900/50 rounded-xl animate-pulse" />
})

// Extend DashboardStats interface locally if needed, or assume it's updated in types
interface ExtendedDashboardStats extends DashboardStats {
  recentThreats?: Threat[]
  systemHealth?: number
  threatsDetected?: number
  activeThreats?: number
}

// Helper component for StatCard to match previous usage or new usage
function StatCard({ title, value, icon: Icon, trend, color, className }: any) {
  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-500/10`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<ExtendedDashboardStats>({
    totalLogs: 0,
    totalThreats: 0,
    criticalThreats: 0,
    recentAnalyses: 0,
    threatsOverTime: [],
    threatDistribution: [],
    severityDistribution: [],
    recentThreats: [],
    systemHealth: 100,
    threatsDetected: 0,
    activeThreats: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()

      // Map API response to expected stats format if needed
      // For now assuming API returns compatible structure or we use defaults
      setStats({
        ...data,
        threatsDetected: data.totalThreats || 0,
        activeThreats: data.activeThreats || 0,
        systemHealth: 98, // Mock health
        recentThreats: data.recentThreats || []
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security Overview</h1>
        <p className="text-gray-400">Real-time threat monitoring and analysis</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Logs Analyzed"
          value={stats.totalLogs}
          icon={FileText}
          trend="+12%"
          color="blue"
        />
        <StatCard
          title="Threats Detected"
          value={stats.threatsDetected}
          icon={ShieldAlert}
          trend="+5%"
          color="red"
        />
        <StatCard
          title="Active Threats"
          value={stats.activeThreats}
          icon={Activity}
          trend="-2%"
          color="orange"
        />
        <StatCard
          title="System Health"
          value={`${stats.systemHealth}%`}
          icon={ShieldCheck}
          trend="+1%"
          color="green"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-6">Threats Over Time</h3>
          <div className="h-[300px]">
            <ThreatsOverTimeChart data={stats.threatsOverTime} />
          </div>
        </div>

        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-6">Threat Distribution</h3>
          <div className="h-[300px]">
            <ThreatDistributionChart data={stats.threatDistribution} />
          </div>
        </div>
      </div>

      {/* Geo Map and Severity Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-6">Global Threat Map</h3>
          <ThreatMap threats={stats.recentThreats || []} />
        </div>

        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-6">Severity Heatmap</h3>
          <div className="h-[400px]">
            <SeverityHeatmap data={stats.severityDistribution} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
  )
}
