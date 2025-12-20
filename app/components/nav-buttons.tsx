'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Upload, Grid3x3, Home } from 'lucide-react'
import { useRef } from 'react'
import ImageUploadForm from './image-upload-form'
import type { ImageUploadFormHandle } from './image-upload-form'

export default function NavButtons() {
  const pathname = usePathname()
  const uploadFormRef = useRef<ImageUploadFormHandle>(null)
  const isHomePage = pathname === '/home'

  const handleUploadClick = (e: React.MouseEvent) => {
    if (isHomePage) {
      e.preventDefault()
      uploadFormRef.current?.triggerFileSelect()
    }
  }

  return (
    <>
      {isHomePage && <ImageUploadForm ref={uploadFormRef} />}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-50">
        {isHomePage ? (
          <button
            onClick={handleUploadClick}
            className="p-3 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity"
            aria-label="Upload"
          >
            <Upload size={24} />
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

