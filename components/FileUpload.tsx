'use client'

import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn, formatBytes } from '@/lib/utils'

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
  maxSize?: number
  acceptedTypes?: string[]
}

export default function FileUpload({
  onUpload,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ['.log', '.txt', '.csv', '.json']
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string>('')

  // Progress simulation effect
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (status === 'uploading') {
      interval = setInterval(() => {
        setProgress(prev => {
          // Slow down near the end
          if (prev >= 95) return prev
          // Random increment between 5 and 15
          const diff = Math.floor(Math.random() * 10) + 5
          return Math.min(prev + diff, 95)
        })
      }, 300)
    } else if (status === 'idle') {
      setProgress(0)
    } else if (status === 'success') {
      setProgress(100)
    }

    return () => clearInterval(interval)
  }, [status])



  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]

      if (selectedFile.size > maxSize) {
        setError(`File size exceeds ${formatBytes(maxSize)}`)
        setStatus('error')
        return
      }

      setFile(selectedFile)
      setStatus('idle')
      setError('')
      setProgress(0)
    }
  }, [maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'text/plain': ['.txt', '.log'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.ms-excel': ['.csv'] // Windows CSV MIME type fix
    }
  })

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setStatus('uploading')
    setProgress(0) // Start at 0, effect will take over

    try {
      // Small delay just to show "0%" state briefly if needed, 
      // but useEffect will start updating soon.

      await onUpload(file)

      setStatus('success')

      setTimeout(() => {
        setFile(null)
        setStatus('idle')
        setProgress(0)
      }, 2000)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
    } finally {
      // Don't set uploading false immediately on success so success state persists briefly
      if (status !== 'success') {
        setUploading(false)
      }
    }
  }

  // Auto-upload effect when file is selected
  useEffect(() => {
    if (file && status === 'idle') {
      handleUpload()
    }
  }, [file, status])

  const removeFile = () => {
    setFile(null)
    setStatus('idle')
    setError('')
    setProgress(0)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 cursor-pointer",
          isDragActive
            ? "border-cyber-blue bg-cyber-blue/10"
            : "border-gray-700 hover:border-cyber-blue/50 bg-gray-900/50",
          file && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
            isDragActive ? "bg-cyber-blue/20 text-cyber-blue" : "bg-gray-800 text-gray-400"
          )}>
            <Upload className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-white mb-1">
              {isDragActive ? 'Drop the file here' : 'Drag & drop your log file here'}
            </p>
            <p className="text-sm text-gray-400">
              or click to browse ({acceptedTypes.join(', ')}) • Max {formatBytes(maxSize)}
            </p>
          </div>
        </div>
      </div>

      {/* Selected File */}
      {file && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-cyber-blue/10 flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5 text-cyber-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
              </div>
            </div>

            {status === 'idle' && (
              <button
                onClick={removeFile}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {status === 'success' && (
              <CheckCircle className="w-5 h-5 text-cyber-green flex-shrink-0" />
            )}

            {status === 'error' && (
              <AlertCircle className="w-5 h-5 text-cyber-red flex-shrink-0" />
            )}
          </div>

          {/* Progress Bar */}
          {status === 'uploading' && (
            <div className="space-y-2">
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center">{progress}% uploaded</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-cyber-red/10 border border-cyber-red/20 rounded-lg">
              <p className="text-sm text-cyber-red">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          {status === 'idle' && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-3 w-full py-3 px-4 bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-lg font-medium text-white hover:shadow-lg hover:shadow-cyber-blue/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analyze Log File
            </button>
          )}

          {status === 'success' && (
            <div className="mt-3 p-3 bg-cyber-green/10 border border-cyber-green/20 rounded-lg">
              <p className="text-sm text-cyber-green text-center">Upload successful! Analyzing...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
