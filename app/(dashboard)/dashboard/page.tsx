'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { FileText, ShieldAlert, Activity, ShieldCheck } from 'lucide-react'
import { DashboardStats, Threat } from '@/types'

// Dashboard Components
import {
  GradientStatCard,
  RecentThreatsTable,
  PageHeader,
  TrafficTrendChart,
  ThreatDonutChart
} from '@/components/dashboard'

// Charts
import ThreatsOverTimeChart from '@/components/charts/ThreatsOverTimeChart'
import SeverityHeatmap from '@/components/charts/SeverityHeatmap'

// Dynamic import for map (SSR disabled)
const ThreatMap = dynamic(() => import('@/components/ThreatMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-900/50 rounded-xl animate-pulse" />
})

interface ExtendedDashboardStats extends DashboardStats {
  recentThreats?: Threat[]
  systemHealth?: number
  threatsDetected?: number
  activeThreats?: number
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
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()

      setStats({
        ...data,
        threatsDetected: data.totalThreats || 0,
        activeThreats: data.activeThreats || 0,
        systemHealth: 98,
        recentThreats: data.recentThreats || []
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStats()
  }

  // Transform threats for the table
  const tableThreats = (stats.recentThreats || []).map((threat, index) => ({
    id: threat.id || `threat-${index}`,
    timestamp: threat.detectedAt || new Date().toISOString(),
    sourceIP: threat.sourceIP || '—',
    destinationIP: threat.destinationIP || '—',
    type: threat.type || 'Unknown',
    severity: threat.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO',
    action: threat.severity === 'CRITICAL' || threat.severity === 'HIGH' ? 'Block' : 'Passthrough'
  }))

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Real-time network traffic and security overview"
        isLive={true}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Stats Grid - 4 Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GradientStatCard
          title="Toplam Log (24s)"
          value={stats.totalLogs || 0}
          icon={FileText}
          gradient="blue"
          badge={{ text: 'Gerçek zamanlı', type: 'info' }}
          delay={0}
        />
        <GradientStatCard
          title="Toplam Analiz"
          value={stats.recentAnalyses || 0}
          icon={Activity}
          gradient="purple"
          subtitle="Son 7 gün"
          delay={0.05}
        />
        <GradientStatCard
          title="Güvenlik Olayları"
          value={stats.totalThreats || 0}
          icon={ShieldAlert}
          gradient="orange"
          badge={stats.criticalThreats > 0 ? { text: 'Dikkat', type: 'warning' } : undefined}
          delay={0.1}
        />
        <GradientStatCard
          title="Kritik Tehditler"
          value={stats.criticalThreats || 0}
          icon={ShieldCheck}
          gradient="red"
          badge={stats.criticalThreats === 0 ? { text: 'Korumalı', type: 'success' } : { text: 'Kritik', type: 'danger' }}
          delay={0.15}
        />
      </div>

      {/* Charts Row - Traffic Trend + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrafficTrendChart title="Traffic Trend (24h)" />
        </div>
        <ThreatDonutChart title="Top Applications" />
      </div>

      {/* Bottom Section - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Events */}
        <RecentThreatsTable threats={tableThreats} maxItems={5} />

        {/* Threat Map */}
        <ThreatMap threats={stats.recentThreats || []} />
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThreatsOverTimeChart data={stats.threatsOverTime} />
        <SeverityHeatmap data={stats.severityDistribution} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/upload"
          className="group p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300"
        >
          <FileText className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Upload New Log</h3>
          <p className="text-sm text-gray-400">
            Analyze a new log file for security threats
          </p>
        </a>

        <a
          href="/history"
          className="group p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300"
        >
          <Activity className="w-8 h-8 text-purple-400 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">View History</h3>
          <p className="text-sm text-gray-400">
            Browse previous analysis results
          </p>
        </a>
      </div>
    </div>
  )
}
