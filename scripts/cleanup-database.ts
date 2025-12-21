// Database Cleanup Script - Veritabanını temizler ve tutarlılığı sağlar
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDatabase() {
    console.log('🧹 Veritabanı temizleme başlıyor...\n')

    try {
        // 1. Mevcut durumu göster
        const beforeStats = {
            logFiles: await prisma.logFile.count(),
            analyses: await prisma.analysis.count(),
            threats: await prisma.threat.count(),
            liveSessions: 0,
            liveLogs: 0
        }

        try {
            beforeStats.liveSessions = await prisma.liveSession.count()
            beforeStats.liveLogs = await prisma.liveLog.count()
        } catch (e) {
            console.log('LiveSession/LiveLog tabloları mevcut değil, atlanıyor...')
        }

        console.log('📊 Önceki Durum:')
        console.log(`   LogFiles: ${beforeStats.logFiles}`)
        console.log(`   Analyses: ${beforeStats.analyses}`)
        console.log(`   Threats: ${beforeStats.threats}`)
        console.log(`   LiveSessions: ${beforeStats.liveSessions}`)
        console.log(`   LiveLogs: ${beforeStats.liveLogs}`)
        console.log('')

        // 2. Orphan analysis'leri bul (LogFile'ı olmayan)
        const orphanAnalyses = await prisma.analysis.findMany({
            where: {
                logFile: null
            },
            select: { id: true }
        })

        if (orphanAnalyses.length > 0) {
            console.log(`⚠️  ${orphanAnalyses.length} orphan analysis bulundu, siliniyor...`)
            await prisma.analysis.deleteMany({
                where: {
                    id: { in: orphanAnalyses.map(a => a.id) }
                }
            })
        }

        // 3. Tüm verileri temizle (sıfırdan başla)
        console.log('\n🗑️  Tüm veriler temizleniyor...')

        // Cascade delete sayesinde threats otomatik silinir
        await prisma.threat.deleteMany({})
        console.log('   ✓ Threats silindi')

        await prisma.analysis.deleteMany({})
        console.log('   ✓ Analyses silindi')

        await prisma.logFile.deleteMany({})
        console.log('   ✓ LogFiles silindi')

        try {
            await prisma.liveLog.deleteMany({})
            console.log('   ✓ LiveLogs silindi')

            await prisma.liveSession.deleteMany({})
            console.log('   ✓ LiveSessions silindi')
        } catch (e) {
            console.log('   ℹ️  Live tablolar mevcut değil, atlandı')
        }

        // 4. Sonuç
        console.log('\n✅ Veritabanı temizlendi!')
        console.log('\n📊 Yeni Durum:')
        console.log(`   LogFiles: ${await prisma.logFile.count()}`)
        console.log(`   Analyses: ${await prisma.analysis.count()}`)
        console.log(`   Threats: ${await prisma.threat.count()}`)

    } catch (error) {
        console.error('❌ Hata:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

cleanupDatabase()
    .then(() => {
        console.log('\n🎉 Temizlik tamamlandı! Artık yeni analizler yapabilirsiniz.')
        process.exit(0)
    })
    .catch((error) => {
        console.error('Cleanup failed:', error)
        process.exit(1)
    })
