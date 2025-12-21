'use client'

import Link from 'next/link'
import { Upload, Grid3x3, Home } from 'lucide-react'
import { useRef } from 'react'
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

function UploadButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity flex items-center justify-center"
      aria-label="Upload"
    >
      <Upload size={24} />
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

export default function Navbar({ username }: { username?: string }) {
  const uploadFormRef = useRef<ImageUploadFormHandle>(null)

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    uploadFormRef.current?.triggerFileSelect()
  }

  return (
    <>
      <ImageUploadForm ref={uploadFormRef} username={username} />
      <nav className="flex flex-row z-50 bg-background items-center justify-center gap-4 py-8">
        <HomeButton />
        <UploadButton onClick={handleUploadClick} />
        <FeedButton />
      </nav>
    </>
  )
}

