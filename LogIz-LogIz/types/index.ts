export interface User {
  id: string
  name?: string | null
  email: string
  role: 'USER' | 'ADMIN' | 'ANALYST'
  image?: string | null
}

export interface LogFile {
  id: string
  filename: string
  originalName: string
  filePath: string
  fileSize: number
  fileType: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  uploadedAt: Date
  userId: string
}

export interface Analysis {
  id: string
  result: any
  threatCount: number
  highSeverity: number
  mediumSeverity: number
  lowSeverity: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  analyzedAt: Date
  processingTime?: number
  logFileId: string
  threats: Threat[]
}

export interface Threat {
  id: string
  type: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  description: string
  sourceIP?: string | null
  destinationIP?: string | null
  targetIP?: string | null
  port?: number | null
  timestamp?: Date | null
  detectedAt?: string | null
  rawLog?: string | null
  confidence?: number | null
  analysisId: string
}

export interface DashboardStats {
  totalLogs: number
  totalThreats: number
  criticalThreats: number
  recentAnalyses: number
  threatsOverTime: { date: string; count: number }[]
  threatDistribution: { name: string; value: number }[]
  severityDistribution: { name: string; value: number }[]
}
