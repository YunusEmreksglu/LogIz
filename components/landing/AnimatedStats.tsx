'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface CounterProps {
    end: number
    suffix?: string
    prefix?: string
    duration?: number
    label: string
    color: string
}

function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2, label, color }: CounterProps) {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (isInView) {
            let startTime: number
            let animationFrame: number

            const animate = (timestamp: number) => {
                if (!startTime) startTime = timestamp
                const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)

                setCount(Math.floor(progress * end))

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(animate)
                }
            }

            animationFrame = requestAnimationFrame(animate)
            return () => cancelAnimationFrame(animationFrame)
        }
    }, [isInView, end, duration])

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center p-8 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300"
        >
            <div className={`text-5xl font-bold mb-3 ${color}`}>
                {prefix}{count.toLocaleString()}{suffix}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">{label}</div>
        </motion.div>
    )
}

export default function AnimatedStats() {
    const stats = [
        { end: 175000, suffix: '+', label: 'Eğitim Verisi', color: 'text-cyan-400' },
        { end: 99, suffix: '%', label: 'Doğruluk Oranı', color: 'text-purple-400' },
        { end: 10, label: 'Saldırı Türü', color: 'text-emerald-400' },
        { end: 5, prefix: '<', suffix: 's', label: 'Analiz Süresi', color: 'text-amber-400' },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <AnimatedCounter key={index} {...stat} />
            ))}
        </div>
    )
}
