'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
    duration?: number
}

interface ToastContextType {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
    success: (title: string, message?: string) => void
    error: (title: string, message?: string) => void
    warning: (title: string, message?: string) => void
    info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

const toastStyles = {
    success: {
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        icon: CheckCircle,
        iconColor: 'text-emerald-400',
    },
    error: {
        bg: 'bg-red-500/10 border-red-500/20',
        icon: AlertCircle,
        iconColor: 'text-red-400',
    },
    warning: {
        bg: 'bg-amber-500/10 border-amber-500/20',
        icon: AlertTriangle,
        iconColor: 'text-amber-400',
    },
    info: {
        bg: 'bg-cyan-500/10 border-cyan-500/20',
        icon: Info,
        iconColor: 'text-cyan-400',
    },
}

interface ToastItemProps {
    toast: Toast
    onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const style = toastStyles[toast.type]
    const Icon = style.icon

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'flex items-start space-x-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg',
                'bg-gray-900/90 dark:bg-gray-900/90 light:bg-white/90',
                style.bg
            )}
        >
            <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', style.iconColor)} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white dark:text-white light:text-gray-900">
                    {toast.title}
                </p>
                {toast.message && (
                    <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mt-0.5">
                        {toast.message}
                    </p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
                <X className="w-4 h-4 text-gray-400" />
            </button>
        </motion.div>
    )
}

interface ToastProviderProps {
    children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { ...toast, id }

        setToasts(prev => [...prev, newToast])

        // Auto remove after duration
        const duration = toast.duration ?? 5000
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }, [removeToast])

    const success = useCallback((title: string, message?: string) => {
        addToast({ type: 'success', title, message })
    }, [addToast])

    const error = useCallback((title: string, message?: string) => {
        addToast({ type: 'error', title, message })
    }, [addToast])

    const warning = useCallback((title: string, message?: string) => {
        addToast({ type: 'warning', title, message })
    }, [addToast])

    const info = useCallback((title: string, message?: string) => {
        addToast({ type: 'info', title, message })
    }, [addToast])

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <div key={toast.id} className="pointer-events-auto">
                            <ToastItem toast={toast} onRemove={removeToast} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}
