'use client'

import React, { useState } from 'react'

interface AttachmentPreviewProps {
  fileUrl: string
  fileName?: string
  fileSize?: number
  type?: 'image' | 'document' | 'audio' | 'video'
  onRemove?: () => void
}

export function AttachmentPreview({
  fileUrl,
  fileName = 'File',
  fileSize,
  type = 'document',
  onRemove,
}: AttachmentPreviewProps) {
  const [loading, setLoading] = useState(true)

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const isImage = type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)

  return (
    <div className="relative group rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
      {isImage ? (
        <div className="relative w-full pt-[100%]">
          <img
            src={fileUrl}
            alt={fileName}
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => setLoading(false)}
          />
        </div>
      ) : (
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{fileName}</p>
            {fileSize && <p className="text-xs text-slate-400">{formatFileSize(fileSize)}</p>}
          </div>
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
