'use client'

import Link from 'next/link'
import { Upload, Grid3x3, Home, User, Check, MessageSquare, Film } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import ImageUploadForm from './image-upload-form'
import type { ImageUploadFormHandle } from './image-upload-form'

function NavIconButton({ 
  href, 
  icon: Icon, 
  ariaLabel 
}: { 
  href: string
  icon: LucideIcon
  ariaLabel: string
}) {
  return (
    <Link
      href={href}
      className="w-12 h-12 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity flex items-center justify-center"
      aria-label={ariaLabel}
    >
      <Icon size={24} />
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
      className={`relative w-12 h-12 rounded-full hover:opacity-80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
        success 
          ? 'bg-green-500 text-white' 
          : 'bg-foreground text-background'
      }`}
      aria-label="Upload"
    >
      {uploading || success ? (
        <svg
          className={`transform -rotate-90 absolute inset-0 ${
            success ? 'text-white' : 'text-background'
          }`}
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
          <Check size={24} className="text-white" />
        ) : (
          <Upload size={24} className="text-background" />
        )}
      </div>
    </button>
  )
}

export default function Navbar() {
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
        onStateChange={setUploadState}
      />
      <nav className="flex flex-row z-50 bg-background items-center justify-center gap-4 py-4 md:py-8">
        <NavIconButton href="/home" icon={Home} ariaLabel="Home" />
        <UploadButton 
          onClick={handleUploadClick}
          uploading={uploadState.uploading}
          progress={uploadState.progress}
          success={uploadState.success}
        />
        <NavIconButton href="/feed" icon={Grid3x3} ariaLabel="Feed" />
        <NavIconButton href="/medialib" icon={Film} ariaLabel="Media Library" />
        <NavIconButton href="/thoughts" icon={MessageSquare} ariaLabel="Thoughts" />
        <NavIconButton href="/profile" icon={User} ariaLabel="Profile" />
      </nav>
    </>
  )
}

