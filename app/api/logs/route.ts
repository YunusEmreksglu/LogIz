import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

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
