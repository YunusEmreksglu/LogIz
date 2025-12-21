'use server'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ThreatLevel } from '@prisma/client'

interface LogEntry {
    timestamp: string
    raw: string
    threat_type: string | null
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
    description: string
    source_ip: string | null
    username: string | null
}

interface SaveSessionRequest {
    connection: {
        host: string
        port: number
        username: string
        logPath: string
    }
    logs: LogEntry[]
    stats: {
        total: number
        critical: number
        high: number
        medium: number
        low: number
        info: number
    }
    startedAt: string
}

// Map SSH threat types to standard attack categories
const THREAT_TYPE_TO_CATEGORY: Record<string, string> = {
    'BRUTE_FORCE': 'Exploits',
    'INVALID_USER': 'Reconnaissance',
    'ROOT_LOGIN': 'Backdoor',
    'LOGIN_SUCCESS': 'Normal',
    'SESSION_OPENED': 'Normal',
    'SESSION_CLOSED': 'Normal',
    'SUDO_USAGE': 'Generic',
    'CONNECTION_CLOSED': 'Normal'
}

export async function POST(request: NextRequest) {
    try {
        const data: SaveSessionRequest = await request.json()

        // Calculate threat type distribution
        const threatTypes: Record<string, number> = {}
        for (const log of data.logs) {
            if (log.threat_type) {
                threatTypes[log.threat_type] = (threatTypes[log.threat_type] || 0) + 1
            }
        }

        // Create session record
        const session = await prisma.liveSession.create({
            data: {
                host: data.connection.host,
                port: data.connection.port,
                username: data.connection.username,
                logPath: data.connection.logPath,
                startedAt: new Date(data.startedAt),
                endedAt: new Date(),
                totalLogs: data.stats.total,
                criticalCount: data.stats.critical,
                highCount: data.stats.high,
                mediumCount: data.stats.medium,
                lowCount: data.stats.low,
                infoCount: data.stats.info,
                threatTypes: threatTypes,
                logs: {
                    create: data.logs.slice(0, 200).map(log => ({
                        timestamp: new Date(log.timestamp),
                        raw: log.raw || '',
                        threatType: log.threat_type,
                        severity: log.severity as ThreatLevel,
                        description: log.description || '',
                        sourceIP: log.source_ip,
                        username: log.username
                    }))
                }
            }
        })

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            message: 'Oturum kaydedildi',
            logsCount: Math.min(data.logs.length, 200)
        })

    } catch (error) {
        console.error('Save session error:', error)
        return NextResponse.json(
            { success: false, error: 'Oturum kaydedilemedi' },
            { status: 500 }
        )
    }
}

// GET - Fetch session history
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '10')

        const sessions = await prisma.liveSession.findMany({
            take: limit,
            orderBy: { startedAt: 'desc' },
            include: {
                _count: { select: { logs: true } }
            }
        })

        return NextResponse.json({
            success: true,
            sessions: sessions.map(s => ({
                id: s.id,
                host: s.host,
                port: s.port,
                username: s.username,
                logPath: s.logPath,
                startedAt: s.startedAt,
                endedAt: s.endedAt,
                totalLogs: s.totalLogs,
                criticalCount: s.criticalCount,
                highCount: s.highCount,
                mediumCount: s.mediumCount,
                lowCount: s.lowCount,
                infoCount: s.infoCount,
                threatTypes: s.threatTypes,
                logsCount: s._count.logs
            }))
        })

    } catch (error) {
        console.error('Fetch sessions error:', error)
        return NextResponse.json(
            { success: false, error: 'Oturumlar alınamadı' },
            { status: 500 }
        )
    }
}
