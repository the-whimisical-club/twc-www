'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Upload, Grid3x3, Home, Check } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import ImageUploadForm from './image-upload-form'
import type { ImageUploadFormHandle } from './image-upload-form'

export default function NavButtons() {
  const pathname = usePathname()
  const uploadFormRef = useRef<ImageUploadFormHandle>(null)
  const isHomePage = pathname === '/home'
  const [uploadState, setUploadState] = useState({ uploading: false, progress: 0, success: false })

  useEffect(() => {
    // Poll for state changes
    const interval = setInterval(() => {
      if (uploadFormRef.current) {
        const state = uploadFormRef.current.getUploadState()
        setUploadState(state)
      }
    }, 50) // Check every 50ms for smooth progress

    return () => clearInterval(interval)
  }, [])

  const handleUploadClick = (e: React.MouseEvent) => {
    if (isHomePage) {
      e.preventDefault()
      uploadFormRef.current?.triggerFileSelect()
    }
  }

  const radius = 20
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (uploadState.progress / 100) * circumference

  return (
    <>
      {isHomePage && <ImageUploadForm ref={uploadFormRef} onStateChange={setUploadState} />}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-50">
        {isHomePage ? (
          <button
            onClick={handleUploadClick}
            disabled={uploadState.uploading}
            className="relative p-3 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Upload"
          >
            {uploadState.uploading || uploadState.success ? (
              <svg
                className="transform -rotate-90 absolute inset-0 text-background"
                width="48"
                height="48"
                viewBox="0 0 48 48"
              >
                {/* Background circle */}
                <circle
                  cx="24"
                  cy="24"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.2"
                />
                {/* Progress circle */}
                {uploadState.uploading && (
                  <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                )}
              </svg>
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center">
              {uploadState.success ? (
                <Check size={24} className="text-background" />
              ) : (
                <Upload size={24} className="text-background" />
              )}
            </div>
          </button>
        ) : (
          <Link
            href="/home"
            className="p-3 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity"
            aria-label="Home"
          >
            <Home size={24} />
          </Link>
        )}
        <Link
          href="/feed"
          className="p-3 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity"
          aria-label="Feed"
        >
          <Grid3x3 size={24} />
        </Link>
      </div>
    </>
  )
}

