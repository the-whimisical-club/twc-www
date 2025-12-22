'use client'

import Link from 'next/link'
import { Upload, Grid3x3, Home, User, Check } from 'lucide-react'
import { useRef, useState } from 'react'
import ImageUploadForm from './image-upload-form'
import type { ImageUploadFormHandle } from './image-upload-form'

function HomeButton() {
  return (
    <Link
      href="/home"
      className="w-12 h-12 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity flex items-center justify-center"
      aria-label="Home"
    >
      <Home size={24} />
    </Link>
  )
}

function UploadButton({ 
  onClick, 
  uploading, 
  progress, 
  success 
}: { 
  onClick: (e: React.MouseEvent) => void
  uploading: boolean
  progress: number
  success: boolean
}) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <button
      onClick={onClick}
      disabled={uploading}
      className="relative w-12 h-12 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      aria-label="Upload"
    >
      {uploading || success ? (
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
          {uploading && (
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
        {success ? (
          <Check size={24} className="text-background" />
        ) : (
          <Upload size={24} className="text-background" />
        )}
      </div>
    </button>
  )
}

function FeedButton() {
  return (
    <Link
      href="/feed"
      className="w-12 h-12 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity flex items-center justify-center"
      aria-label="Feed"
    >
      <Grid3x3 size={24} />
    </Link>
  )
}

function ProfileButton() {
  return (
    <Link
      href="/profile"
      className="w-12 h-12 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity flex items-center justify-center"
      aria-label="Profile"
    >
      <User size={24} />
    </Link>
  )
}

export default function Navbar({ username }: { username?: string }) {
  const uploadFormRef = useRef<ImageUploadFormHandle>(null)
  const [uploadState, setUploadState] = useState({ uploading: false, progress: 0, success: false })

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    uploadFormRef.current?.triggerFileSelect()
  }

  return (
    <>
      <ImageUploadForm 
        ref={uploadFormRef} 
        username={username} 
        onStateChange={setUploadState}
      />
      <nav className="flex flex-row z-50 bg-background items-center justify-center gap-4 py-4 md:py-8">
        <HomeButton />
        <UploadButton 
          onClick={handleUploadClick}
          uploading={uploadState.uploading}
          progress={uploadState.progress}
          success={uploadState.success}
        />
        <FeedButton />
        <ProfileButton />
      </nav>
    </>
  )
}

