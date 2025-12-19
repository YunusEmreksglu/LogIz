// Forces HMR rebuild
import axios from 'axios'

export interface AnalysisRequest {
  logContent: string
  filename: string
  fileType: string
}

export interface ThreatDetection {
  type: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  description: string
  sourceIP?: string
  targetIP?: string
  port?: number
  timestamp?: string
  rawLog?: string
  confidence?: number
}

export interface AnalysisResponse {
  success: boolean
  threatCount: number
  threats: ThreatDetection[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  processingTime: number
  error?: string
}

const PYTHON_API_URL = 'http://127.0.0.1:5000/api' // Hardcoded for reliability
const PYTHON_API_KEY = process.env.PYTHON_API_KEY

export async function analyzeLogWithPython(data: AnalysisRequest): Promise<AnalysisResponse> {
  try {
    // Convert to Base64 for reliable JSON upload
    const buffer = Buffer.from(data.logContent)
    const base64Content = buffer.toString('base64')

    const response = await axios.post(
      `${PYTHON_API_URL}/analyze/upload`,
      {
        file_content: base64Content,
        filename: data.filename
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PYTHON_API_KEY}`,
        },
        timeout: 300000, // 5 minutes
      }
    )

    const result = response.data

    if (result.success) {
      const threats = result.attacks.map((attack: any) => ({
        type: attack.type,
        severity: attack.severity,
        description: attack.description,
        sourceIP: attack.sourceIP,
        targetIP: attack.targetIP,
        port: attack.port,
        confidence: attack.confidence,
        rawLog: attack.rawLog
      }))

      // Use severity_summary from Python API (ALL threats, not just top 100)
      const summary = result.severity_summary ? {
        critical: result.severity_summary.CRITICAL || 0,
        high: result.severity_summary.HIGH || 0,
        medium: result.severity_summary.MEDIUM || 0,
        low: result.severity_summary.LOW || 0,
        info: result.severity_summary.INFO || 0,
      } : {
        critical: threats.filter((t: any) => t.severity === 'CRITICAL').length,
        high: threats.filter((t: any) => t.severity === 'HIGH').length,
        medium: threats.filter((t: any) => t.severity === 'MEDIUM').length,
        low: threats.filter((t: any) => t.severity === 'LOW').length,
        info: threats.filter((t: any) => t.severity === 'INFO').length,
      }

      return {
        success: true,
        threatCount: result.results.attacks_detected,
        threats: threats,
        summary: summary,
        processingTime: (result.results.prediction_time_seconds || 0) * 1000,
        // Pass through additional data from Python API
        severity_summary: result.severity_summary,
        attack_type_distribution: result.attack_type_distribution,
        totalLogLines: result.results.total_records, // Capture total read lines
      } as any
    }

    return response.data
  } catch (error: any) {
    console.error('Python API Error:', error)
    throw new Error(error.message || 'Unexpected error during log analysis')
  }
}

// Mock function for testing without Python API

