/**
 * Client-side image compression utility
 * Compresses images before upload to avoid platform payload limits
 */

const MAX_UPLOAD_SIZE = 4 * 1024 * 1024 // 4MB - safe limit below 4.5MB platform limit
const MAX_DIMENSION = 3840 // Max width or height (4K)

interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
  useWebWorker?: boolean
}

/**
 * Compress an image file using Canvas API
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = MAX_UPLOAD_SIZE / (1024 * 1024), // 4MB default
    maxWidthOrHeight = MAX_DIMENSION,
    quality = 0.85, // Start with 85% quality
  } = options

  // If file is already small enough, return as-is
  if (file.size <= MAX_UPLOAD_SIZE) {
    return file
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width
        let height = img.height
        
        // Scale down if exceeds max dimension
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          const scale = Math.min(maxWidthOrHeight / width, maxWidthOrHeight / height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        
        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height)
        
        // Try different quality levels to get under size limit
        const tryCompress = (currentQuality: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }
              
              const sizeMB = blob.size / (1024 * 1024)
              
              // If still too large and quality can be reduced further
              if (blob.size > MAX_UPLOAD_SIZE && currentQuality > 0.5) {
                // Reduce quality by 0.1 and try again
                tryCompress(Math.max(0.5, currentQuality - 0.1))
                return
              }
              
              // If still too large, reduce dimensions
              if (blob.size > MAX_UPLOAD_SIZE && width > 1920 && height > 1080) {
                const newWidth = Math.round(width * 0.9)
                const newHeight = Math.round(height * 0.9)
                canvas.width = newWidth
                canvas.height = newHeight
                ctx.drawImage(img, 0, 0, newWidth, newHeight)
                tryCompress(currentQuality)
                return
              }
              
              // Create new file with compressed blob
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.jpg'), // Ensure .jpg extension
                {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }
              )
              
              console.log('Image compressed:', {
                originalSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
                compressedSize: (blob.size / (1024 * 1024)).toFixed(2) + 'MB',
                originalDimensions: `${img.width}x${img.height}`,
                compressedDimensions: `${width}x${height}`,
                quality: currentQuality,
              })
              
              resolve(compressedFile)
            },
            'image/jpeg',
            currentQuality
          )
        }
        
        // Start compression
        tryCompress(quality)
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }
      
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Check if file needs compression
 */
export function needsCompression(file: File): boolean {
  return file.size > MAX_UPLOAD_SIZE
}

