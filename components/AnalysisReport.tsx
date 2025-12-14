'use client'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Download } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
    analysis: {
        id: string
        threatCount: number
        threats: any[]
        processingTime?: number
        analyzedAt?: string | Date
        highSeverity?: number
        mediumSeverity?: number
        lowSeverity?: number
        [key: string]: any
    }
    logFile: {
        originalName: string
        fileSize?: number
        fileType?: string
        [key: string]: any
    }
}

// Türkçe karakterleri ASCII'ye dönüştür (jsPDF UTF-8 desteklemiyor)
function turkishToAscii(text: string): string {
    const turkishChars: Record<string, string> = {
        'ı': 'i', 'İ': 'I',
        'ğ': 'g', 'Ğ': 'G',
        'ü': 'u', 'Ü': 'U',
        'ş': 's', 'Ş': 'S',
        'ö': 'o', 'Ö': 'O',
        'ç': 'c', 'Ç': 'C'
    }
    return text.replace(/[ığüşöçİĞÜŞÖÇ]/g, char => turkishChars[char] || char)
}

// Renk paletleri
const colors = {
    primary: [6, 182, 212] as [number, number, number],
    secondary: [168, 85, 247] as [number, number, number],
    dark: [15, 23, 42] as [number, number, number],
    darkBg: [30, 41, 59] as [number, number, number],
    gray: [100, 116, 139] as [number, number, number],
    lightGray: [148, 163, 184] as [number, number, number],
    critical: [239, 68, 68] as [number, number, number],
    high: [249, 115, 22] as [number, number, number],
    medium: [234, 179, 8] as [number, number, number],
    low: [34, 197, 94] as [number, number, number],
    info: [59, 130, 246] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
}

export default function AnalysisReport({ analysis, logFile }: Props) {

    const formatBytes = (bytes?: number) => {
        if (!bytes) return 'N/A'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getSeverityColor = (severity: string): [number, number, number] => {
        switch (severity?.toUpperCase()) {
            case 'CRITICAL': return colors.critical
            case 'HIGH': return colors.high
            case 'MEDIUM': return colors.medium
            case 'LOW': return colors.low
            default: return colors.info
        }
    }

    const generatePDF = () => {
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height
        const margin = 15

        // ========== HEADER ==========
        // Dark header background
        doc.setFillColor(...colors.dark)
        doc.rect(0, 0, pageWidth, 50, 'F')

        // Gradient line under header
        doc.setFillColor(...colors.primary)
        doc.rect(0, 50, pageWidth, 3, 'F')

        // Logo/Brand
        doc.setTextColor(...colors.primary)
        doc.setFontSize(28)
        doc.setFont('helvetica', 'bold')
        doc.text('LogIz', margin, 25)

        // Subtitle
        doc.setFontSize(12)
        doc.setTextColor(...colors.lightGray)
        doc.setFont('helvetica', 'normal')
        doc.text('Security Analysis Report', margin, 35)

        // Date and ID on right
        doc.setFontSize(10)
        doc.setTextColor(...colors.lightGray)
        const dateStr = analysis.analyzedAt
            ? new Date(analysis.analyzedAt).toLocaleString('en-GB')
            : new Date().toLocaleString('en-GB')
        doc.text(`Date: ${dateStr}`, pageWidth - margin, 20, { align: 'right' })
        doc.text(`Report ID: ${analysis.id.slice(0, 12)}...`, pageWidth - margin, 28, { align: 'right' })

        // ========== SUMMARY CARDS ==========
        let currentY = 65

        // Section title
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.dark)
        doc.text('Executive Summary', margin, currentY)
        currentY += 10

        // Stats cards background
        const cardWidth = (pageWidth - margin * 2 - 15) / 4
        const cardHeight = 35
        const cardY = currentY

        // Calculate stats
        const criticalCount = analysis.threats?.filter(t => t.severity === 'CRITICAL').length || 0
        const highCount = analysis.threats?.filter(t => t.severity === 'HIGH').length || 0
        const mediumCount = analysis.threats?.filter(t => t.severity === 'MEDIUM').length || 0
        const lowCount = analysis.threats?.filter(t => t.severity === 'LOW').length || 0

        const statsCards = [
            { label: 'Total Threats', value: analysis.threatCount.toString(), color: colors.primary },
            { label: 'Critical', value: criticalCount.toString(), color: colors.critical },
            { label: 'High', value: highCount.toString(), color: colors.high },
            { label: 'Medium/Low', value: `${mediumCount}/${lowCount}`, color: colors.medium },
        ]

        statsCards.forEach((card, index) => {
            const cardX = margin + index * (cardWidth + 5)

            // Card background
            doc.setFillColor(245, 247, 250)
            doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 3, 3, 'F')

            // Left color bar
            doc.setFillColor(...card.color)
            doc.rect(cardX, cardY, 4, cardHeight, 'F')

            // Value
            doc.setFontSize(20)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...card.color)
            doc.text(card.value, cardX + cardWidth / 2, cardY + 15, { align: 'center' })

            // Label
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...colors.gray)
            doc.text(card.label, cardX + cardWidth / 2, cardY + 27, { align: 'center' })
        })

        currentY = cardY + cardHeight + 15

        // ========== FILE INFORMATION ==========
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.dark)
        doc.text('File Information', margin, currentY)
        currentY += 8

        const fileInfo = [
            ['File Name', turkishToAscii(logFile.originalName)],
            ['File Size', formatBytes(logFile.fileSize)],
            ['Analysis ID', analysis.id],
            ['Processing Time', analysis.processingTime ? `${(analysis.processingTime / 1000).toFixed(2)} seconds` : 'N/A'],
        ]

        autoTable(doc, {
            startY: currentY,
            body: fileInfo,
            theme: 'plain',
            styles: {
                fontSize: 10,
                cellPadding: 4,
                textColor: colors.gray
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 45, textColor: colors.dark },
                1: { cellWidth: 120 }
            },
            margin: { left: margin }
        })

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 15

        // ========== THREAT SEVERITY BREAKDOWN ==========
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.dark)
        doc.text('Threat Severity Breakdown', margin, currentY)
        currentY += 8

        const severityData = [
            ['CRITICAL', criticalCount.toString(), 'Immediate action required'],
            ['HIGH', highCount.toString(), 'Urgent attention needed'],
            ['MEDIUM', mediumCount.toString(), 'Should be addressed soon'],
            ['LOW', lowCount.toString(), 'Low priority issues'],
        ]

        autoTable(doc, {
            startY: currentY,
            head: [['Severity', 'Count', 'Priority']],
            body: severityData,
            theme: 'grid',
            headStyles: {
                fillColor: colors.dark,
                textColor: colors.white,
                fontStyle: 'bold',
                fontSize: 10
            },
            styles: {
                fontSize: 10,
                cellPadding: 5
            },
            columnStyles: {
                0: { cellWidth: 35, fontStyle: 'bold' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 80 }
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 0) {
                    const severity = data.cell.raw as string
                    data.cell.styles.textColor = getSeverityColor(severity)
                }
                if (data.section === 'body' && data.column.index === 1) {
                    const severity = severityData[data.row.index][0]
                    data.cell.styles.textColor = getSeverityColor(severity)
                    data.cell.styles.fontStyle = 'bold'
                }
            },
            margin: { left: margin }
        })

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 15

        // ========== DETAILED THREAT ANALYSIS ==========
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.dark)
        doc.text('Detailed Threat Analysis', margin, currentY)
        currentY += 8

        if (analysis.threats && analysis.threats.length > 0) {
            const threatRows = analysis.threats.slice(0, 20).map(t => [
                t.severity || 'N/A',
                turkishToAscii(t.type || 'Unknown'),
                turkishToAscii((t.description || '').substring(0, 40)) + ((t.description?.length || 0) > 40 ? '...' : ''),
                t.sourceIP || 'N/A',
                t.confidence ? `${(t.confidence * 100).toFixed(0)}%` : 'N/A'
            ])

            autoTable(doc, {
                startY: currentY,
                head: [['Severity', 'Type', 'Description', 'Source IP', 'Confidence']],
                body: threatRows,
                theme: 'striped',
                headStyles: {
                    fillColor: colors.secondary,
                    textColor: colors.white,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 4
                },
                columnStyles: {
                    0: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 60 },
                    3: { cellWidth: 32 },
                    4: { cellWidth: 22, halign: 'center' }
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 0) {
                        const severity = data.cell.raw as string
                        data.cell.styles.textColor = getSeverityColor(severity)
                    }
                },
                margin: { left: margin }
            })
        } else {
            doc.setFontSize(11)
            doc.setTextColor(...colors.gray)
            doc.setFont('helvetica', 'italic')
            doc.text('No threats detected in this analysis.', margin, currentY + 5)
        }

        // ========== FOOTER ON ALL PAGES ==========
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)

            // Footer line
            doc.setDrawColor(...colors.lightGray)
            doc.setLineWidth(0.5)
            doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20)

            // Footer text
            doc.setFontSize(8)
            doc.setTextColor(...colors.gray)
            doc.setFont('helvetica', 'normal')
            doc.text('Generated by LogIz Security Analysis Platform', margin, pageHeight - 12)
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 12, { align: 'right' })

            // Confidential notice
            doc.setFontSize(7)
            doc.setTextColor(...colors.lightGray)
            doc.text('CONFIDENTIAL - For authorized personnel only', pageWidth / 2, pageHeight - 12, { align: 'center' })
        }

        // Save
        const fileName = logFile.originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_')
        doc.save(`LogIz_Security_Report_${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`)
    }

    return (
        <motion.button
            onClick={(e) => {
                e.stopPropagation()
                generatePDF()
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 hover:from-cyan-500/20 hover:to-purple-500/20 text-sm text-cyan-400 transition-all border border-cyan-500/20 hover:border-cyan-500/40"
        >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
        </motion.button>
    )
}
