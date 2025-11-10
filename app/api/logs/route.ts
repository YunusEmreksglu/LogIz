import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // TODO: Get userId from session
    const userId = 'temp-user-id'

    const logFiles = await prisma.logFile.findMany({
      where: { userId },
      include: {
        analyses: {
          include: {
            threats: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      take: 20,
    })

    return NextResponse.json({ logFiles })
  } catch (error) {
    console.error('Logs fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}
