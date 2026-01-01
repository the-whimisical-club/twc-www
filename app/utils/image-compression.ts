/**
 * Client-side image compression utility
 * Compresses images before upload to avoid platform payload limits
 * Handles EXIF orientation to prevent rotated images
 */

import EXIF from 'exif-js'

const MAX_UPLOAD_SIZE = 4 * 1024 * 1024 // 4MB - safe limit below 4.5MB platform limit
const MAX_DIMENSION = 3840 // Max width or height (4K)

interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  quality?: number
  useWebWorker?: boolean
}

/**
 * Get EXIF orientation from image file
 * Returns 1 (normal) if EXIF reading fails or orientation is not found
 */
function getOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      EXIF.getData(file as any, function(this: any) {
        try {
          const orientation = EXIF.getTag(this, 'Orientation')
          // EXIF orientation values are 1-8, default to 1 if invalid
          const validOrientation = (orientation && orientation >= 1 && orientation <= 8) 
            ? orientation 
            : 1
          resolve(validOrientation)
        } catch (tagErr) {
          console.warn('Error reading EXIF orientation tag:', tagErr)
          resolve(1) // Default to normal orientation
        }
      })
    } catch (exifErr) {
      // EXIF library may fail in some browsers or with certain file types
      console.warn('EXIF.getData failed, using default orientation:', exifErr)
      resolve(1) // Default to normal orientation
    }
  })
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

  return new Promise(async (resolve, reject) => {
    // Get EXIF orientation first
    let orientation = 1
    try {
      orientation = await getOrientation(file)
      console.log('EXIF orientation detected:', orientation)
    } catch (err) {
      console.warn('Could not read EXIF orientation, using default:', err)
      // Continue with default orientation (1 = normal)
    }

    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Get natural image dimensions
        const imgWidth = img.naturalWidth || img.width
        const imgHeight = img.naturalHeight || img.height
        
        // Determine if we need to swap dimensions for canvas (orientations 5, 6, 7, 8)
        const needsDimensionSwap = orientation >= 5 && orientation <= 8
        let canvasWidth = needsDimensionSwap ? imgHeight : imgWidth
        let canvasHeight = needsDimensionSwap ? imgWidth : imgHeight
        
        // Calculate scale if exceeds max dimension
        let scale = 1
        if (canvasWidth > maxWidthOrHeight || canvasHeight > maxWidthOrHeight) {
          scale = Math.min(maxWidthOrHeight / canvasWidth, maxWidthOrHeight / canvasHeight)
        }
        
        // Final canvas dimensions (after scaling)
        const finalWidth = Math.round(canvasWidth * scale)
        const finalHeight = Math.round(canvasHeight * scale)
        
        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = finalWidth
        canvas.height = finalHeight
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        // Save context and apply EXIF orientation transformation
        ctx.save()
        
        // Apply transformation based on orientation
        // Transformations are applied, then we draw the image at its natural size
        switch (orientation) {
          case 2:
            // Horizontal flip
            ctx.translate(finalWidth, 0)
            ctx.scale(-1, 1)
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, finalWidth, finalHeight)
            break
          case 3:
            // 180° rotation
            ctx.translate(finalWidth, finalHeight)
            ctx.rotate(Math.PI)
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, finalWidth, finalHeight)
            break
          case 4:
            // Vertical flip
            ctx.translate(0, finalHeight)
            ctx.scale(1, -1)
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, finalWidth, finalHeight)
            break
          case 5:
            // Vertical flip + 90° clockwise
            ctx.translate(0, finalWidth)
            ctx.rotate(-Math.PI / 2)
            ctx.scale(1, -1)
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, finalHeight, finalWidth)
            break
          case 6:
            // 90° clockwise (most common for portrait photos from phones)
            ctx.translate(finalHeight, 0)
            ctx.rotate(Math.PI / 2)
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, finalHeight, finalWidth)
            break
          case 7:
            // Horizontal flip + 90° counter-clockwise
            ctx.translate(finalHeight, finalWidth)
            ctx.rotate(Math.PI / 2)
            ctx.scale(-1, 1)
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, finalHeight, finalWidth)
            break
          case 8:
            // 90° counter-clockwise
            ctx.translate(0, finalHeight)
            ctx.rotate(-Math.PI / 2)
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, finalHeight, finalWidth)
            break
          default:
            // Orientation 1 or unknown - no transformation needed
            ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, finalWidth, finalHeight)
            break
        }
        
        // Restore context
        ctx.restore()
        
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
              
              // If still too large, reduce dimensions and re-render
              if (blob.size > MAX_UPLOAD_SIZE && finalWidth > 1920 && finalHeight > 1080) {
                const newWidth = Math.round(finalWidth * 0.9)
                const newHeight = Math.round(finalHeight * 0.9)
                canvas.width = newWidth
                canvas.height = newHeight
                ctx.clearRect(0, 0, newWidth, newHeight)
                ctx.save()
                // Re-apply orientation with new dimensions
                switch (orientation) {
                  case 2:
                    ctx.translate(newWidth, 0)
                    ctx.scale(-1, 1)
                    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, newWidth, newHeight)
                    break
                  case 3:
                    ctx.translate(newWidth, newHeight)
                    ctx.rotate(Math.PI)
                    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, newWidth, newHeight)
                    break
                  case 4:
                    ctx.translate(0, newHeight)
                    ctx.scale(1, -1)
                    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, newWidth, newHeight)
                    break
                  case 5:
                    ctx.translate(0, newWidth)
                    ctx.rotate(-Math.PI / 2)
                    ctx.scale(1, -1)
                    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, newHeight, newWidth)
                    break
                  case 6:
                    ctx.translate(newHeight, 0)
                    ctx.rotate(Math.PI / 2)
                    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, newHeight, newWidth)
                    break
                  case 7:
                    ctx.translate(newHeight, newWidth)
                    ctx.rotate(Math.PI / 2)
                    ctx.scale(-1, 1)
                    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, newHeight, newWidth)
                    break
                  case 8:
                    ctx.translate(0, newHeight)
                    ctx.rotate(-Math.PI / 2)
                    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, newHeight, newWidth)
                    break
                  default:
                    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, newWidth, newHeight)
                    break
                }
                ctx.restore()
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
                originalDimensions: `${imgWidth}x${imgHeight}`,
                compressedDimensions: `${finalWidth}x${finalHeight}`,
                orientation: orientation,
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

