'use client'

import Link from 'next/link'
import { Upload, Grid3x3 } from 'lucide-react'

export default function NavButtons() {
  return (
    <div className="fixed top-4 right-4 flex gap-4 z-50">
      <Link
        href="/home"
        className="p-3 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity"
        aria-label="Upload"
      >
        <Upload size={24} />
      </Link>
      <Link
        href="/feed"
        className="p-3 bg-foreground text-background rounded-full hover:opacity-80 transition-opacity"
        aria-label="Feed"
      >
        <Grid3x3 size={24} />
      </Link>
    </div>
  )
}

