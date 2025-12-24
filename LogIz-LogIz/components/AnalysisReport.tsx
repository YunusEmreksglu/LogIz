'use client'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FileText } from 'lucide-react'

interface Props {
    analysis: any
    logFile: any
}

export default function AnalysisReport({ analysis, logFile }: Props) {
    const generatePDF = () => {
        const doc = new jsPDF()

        // Title
        doc.setFontSize(22)
        doc.setTextColor(0, 180, 216) // Cyan
        doc.text('LogIz Security Analysis Report', 14, 22)

        // Metadata
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text(`File Name: ${logFile.originalName}`, 14, 32)
        doc.text(`Analysis ID: ${analysis.id}`, 14, 38)
        doc.text(`Date: ${new Date(analysis.analyzedAt).toLocaleString()}`, 14, 44)

        // ===== SECTION 1: Severity Summary =====
        doc.setFontSize(14)
        doc.setTextColor(0, 0, 0)
        doc.text('Severity Summary', 14, 55)

        const criticalCount = analysis.threats.filter((t: any) => t.severity === 'CRITICAL').length
        const highCount = analysis.threats.filter((t: any) => t.severity === 'HIGH').length
        const mediumCount = analysis.threats.filter((t: any) => t.severity === 'MEDIUM').length
        const lowCount = analysis.threats.filter((t: any) => t.severity === 'LOW').length

        const severityStats = [
            ['Total Threats', analysis.threatCount.toString()],
            ['Critical', criticalCount.toString()],
            ['High', highCount.toString()],
            ['Medium', mediumCount.toString()],
            ['Low', lowCount.toString()],
        ]

        autoTable(doc, {
            startY: 60,
            head: [['Metric', 'Count']],
            body: severityStats,
            theme: 'striped',
            headStyles: { fillColor: [0, 180, 216], textColor: [255, 255, 255] },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 40, halign: 'center' }
            },
            styles: { fontSize: 10 }
        })

        // ===== SECTION 2: Attack Type Distribution =====
        // @ts-ignore
        const attackTypeStartY = doc.lastAutoTable.finalY + 15

        doc.setFontSize(14)
        doc.text('Attack Type Distribution', 14, attackTypeStartY)

        // Saldırı türlerini say
        const attackTypeCounts: Record<string, number> = {}
        analysis.threats.forEach((t: any) => {
            const type = t.type || 'Unknown'
            attackTypeCounts[type] = (attackTypeCounts[type] || 0) + 1
        })

        const attackTypeData = Object.entries(attackTypeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => [type, count.toString()])

        if (attackTypeData.length > 0) {
            autoTable(doc, {
                startY: attackTypeStartY + 5,
                head: [['Attack Type', 'Count']],
                body: attackTypeData,
                theme: 'striped',
                headStyles: { fillColor: [138, 43, 226], textColor: [255, 255, 255] }, // Purple
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 40, halign: 'center' }
                },
                styles: { fontSize: 10 }
            })
        }

        // ===== SECTION 3: Detailed Threats (Improved Table) =====
        // @ts-ignore
        const threatStartY = doc.lastAutoTable.finalY + 15

        doc.setFontSize(14)
        doc.text('Detected Threats', 14, threatStartY)

        // Sadece ilk 50 tehdidi göster (PDF çok uzun olmasın)
        const threatsToShow = analysis.threats.slice(0, 50)

        const threatData = threatsToShow.map((t: any) => [
            t.severity,
            t.type || 'Unknown',
            (t.description || '').substring(0, 50) + ((t.description || '').length > 50 ? '...' : ''),
            t.sourceIP || 'N/A'
        ])

        autoTable(doc, {
            startY: threatStartY + 5,
            head: [['Severity', 'Type', 'Description', 'Source IP']],
            body: threatData,
            theme: 'grid',
            styles: {
                fontSize: 8,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [50, 50, 50],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
                1: { cellWidth: 30 },
                2: { cellWidth: 90 },
                3: { cellWidth: 35 }
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 0) {
                    const severity = data.cell.raw
                    if (severity === 'CRITICAL') {
                        data.cell.styles.textColor = [220, 53, 69] // Red
                        data.cell.styles.fillColor = [255, 230, 230]
                    }
                    if (severity === 'HIGH') {
                        data.cell.styles.textColor = [255, 140, 0] // Orange
                        data.cell.styles.fillColor = [255, 243, 224]
                    }
                    if (severity === 'MEDIUM') {
                        data.cell.styles.textColor = [255, 193, 7] // Yellow
                        data.cell.styles.fillColor = [255, 252, 230]
                    }
                    if (severity === 'LOW') {
                        data.cell.styles.textColor = [23, 162, 184] // Cyan
                    }
                }
            }
        })

        // Eğer 50'den fazla tehdit varsa not ekle
        if (analysis.threats.length > 50) {
            // @ts-ignore
            const noteY = doc.lastAutoTable.finalY + 10
            doc.setFontSize(9)
            doc.setTextColor(100, 100, 100)
            doc.text(`* Showing first 50 of ${analysis.threats.length} threats. Full data available in application.`, 14, noteY)
        }

        // Footer
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(128, 128, 128)
            doc.text(
                `Generated by LogIz AI - Page ${i} of ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            )
        }

        doc.save(`logiz-report-${logFile.originalName}.pdf`)
    }

    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                generatePDF()
            }}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors border border-gray-700"
        >
            <FileText className="w-4 h-4" />
            <span>Download Report</span>
        </button>
    )
}
