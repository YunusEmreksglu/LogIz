import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      // For now, allow public access if no session, or return empty
      // If authenticaton is strict, uncomment below:
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

      // Returning all logs for demo/dev purposes if not logged in
      const logFiles = await prisma.logFile.findMany({
        take: 20,
        orderBy: { uploadedAt: 'desc' },
        include: {
          analyses: {
            include: {
              threats: true
            }
          }
        }
      })
      return NextResponse.json({ logFiles })
    }

    const userId = session.user.id

    // Check if user exists in DB
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!userExists) {
      // Stale session - user not in DB. Show public/anonymous logs instead
      const logFiles = await prisma.logFile.findMany({
        take: 20,
        orderBy: { uploadedAt: 'desc' },
        include: {
          analyses: {
            include: {
              threats: true
            }
          }
        }
      })
      return NextResponse.json({ logFiles })
    }

    const logFiles = await prisma.logFile.findMany({
      where: {
        userId: userId
      },
      take: 20,
      orderBy: { uploadedAt: 'desc' },
      include: {
        analyses: {
          include: {
            threats: true
          }
        }
      }
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
