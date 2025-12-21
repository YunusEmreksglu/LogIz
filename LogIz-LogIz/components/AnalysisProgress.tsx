'use client'

import { useEffect, useState } from 'react'
import { Loader } from 'lucide-react'

export default function AnalysisProgress() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((oldProgress) => {
                if (oldProgress === 100) {
                    return 100
                }
                const diff = Math.random() * 10
                return Math.min(oldProgress + diff, 99)
            })
        }, 200)

        return () => {
            clearInterval(timer)
        }
    }, [])

    return (
        <div className="mt-8 p-6 rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-700">
            <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4">
                    <Loader className="w-6 h-6 text-cyber-blue animate-spin" />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                            Log Dosyanız Analiz Ediliyor...
                        </h3>
                        <p className="text-sm text-gray-400">
                            UNSW-NB15 veri seti ile 175.000+ saldırı pattern&apos;i taranıyor
                        </p>
                    </div>
                    <span className="text-lg font-bold text-cyber-blue">{Math.round(progress)}%</span>
                </div>

                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                    <span>Veri işleniyor...</span>
                    <span>Tahmini süre: &lt;5s</span>
                </div>
            </div>
        </div>
    )
}
