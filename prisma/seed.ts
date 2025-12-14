
import { PrismaClient, ThreatLevel, AnalysisStatus, FileStatus, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Clean existing data
    await prisma.threat.deleteMany()
    await prisma.analysis.deleteMany()
    await prisma.logFile.deleteMany()
    await prisma.user.deleteMany()

    // Create Admin User
    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@logiz.com',
            password: 'hashed_password_here', // In a real app, hash this!
            role: UserRole.ADMIN,
        }
    })
    console.log(`👤 Created user: ${admin.email}`)

    // Create Log File
    const logFile = await prisma.logFile.create({
        data: {
            filename: 'firewall_traffic.log',
            originalName: 'firewall_traffic.log',
            filePath: '/uploads/firewall_traffic.log',
            fileSize: 1024 * 1024 * 5, // 5MB
            fileType: 'text/plain',
            status: FileStatus.COMPLETED,
            userId: admin.id,
        }
    })
    console.log(`bf Created log file: ${logFile.filename}`)

    // Create Analysis
    const analysis = await prisma.analysis.create({
        data: {
            logFileId: logFile.id,
            status: AnalysisStatus.COMPLETED,
            result: {},
            threatCount: 150,
            highSeverity: 45,
            mediumSeverity: 60,
            lowSeverity: 45,
        }
    })
    console.log(`sc Created analysis: ${analysis.id}`)

    // Generate Threats
    const threatTypes = ['DoS', 'Exploits', 'Reconnaissance', 'Backdoor', 'Shellcode', 'Worms', 'Fuzzers', 'Generic']
    const countries = ['China', 'Russia', 'North Korea', 'United States', 'Germany', 'Brazil', 'India']
    const severities = [ThreatLevel.CRITICAL, ThreatLevel.HIGH, ThreatLevel.MEDIUM, ThreatLevel.LOW, ThreatLevel.INFO]

    const threatsData = Array.from({ length: 200 }).map(() => {
        const type = threatTypes[Math.floor(Math.random() * threatTypes.length)]
        const severity = severities[Math.floor(Math.random() * severities.length)]
        const country = countries[Math.floor(Math.random() * countries.length)]

        return {
            type,
            severity,
            description: `Detected ${type} attempt from ${country}`,
            sourceIP: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            targetIP: `10.0.0.${Math.floor(Math.random() * 255)}`,
            port: Math.floor(Math.random() * 65535),
            timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Last 7 days
            sourceCountry: country,
            confidence: Math.random() * 0.5 + 0.5, // 0.5 - 1.0
            analysisId: analysis.id,
        }
    })

    await prisma.threat.createMany({
        data: threatsData
    })

    console.log(`⚠️ Created ${threatsData.length} threats`)
    console.log('✅ Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
