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

      // Calculate summary
      const summary = {
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
        processingTime: 0 // Backend doesn't return time yet, negligible
      }
    }

    return response.data
  } catch (error: any) {
    console.error('Python API Error:', error)
    throw new Error(error.message || 'Unexpected error during log analysis')
  }
}

// Mock function for testing without Python API
export async function mockAnalyzeLog(data: AnalysisRequest): Promise<AnalysisResponse> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000))

  const mockThreats: ThreatDetection[] = [
    {
      type: 'SQL_INJECTION',
      severity: 'CRITICAL',
      description: 'SQL injection attempt detected in login form',
      sourceIP: '192.168.1.100',
      targetIP: '10.0.0.5',
      port: 3306,
      timestamp: new Date().toISOString(),
      confidence: 0.95,
      rawLog: "SELECT * FROM users WHERE username='admin' OR '1'='1"
    },
    {
      type: 'BRUTE_FORCE',
      severity: 'HIGH',
      description: 'Multiple failed login attempts detected',
      sourceIP: '203.0.113.45',
      confidence: 0.87,
    },
    {
      type: 'XSS',
      severity: 'MEDIUM',
      description: 'Cross-site scripting attempt in user input',
      sourceIP: '198.51.100.78',
      confidence: 0.72,
    }
  ]

  return {
    success: true,
    threatCount: mockThreats.length,
    threats: mockThreats,
    summary: {
      critical: 1,
      high: 1,
      medium: 1,
      low: 0,
      info: 0
    },
    processingTime: 2000
  }
}
