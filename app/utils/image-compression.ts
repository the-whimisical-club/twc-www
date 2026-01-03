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
        // Get natural image dimensions (these are the raw pixel dimensions from the file)
        const imgWidth = img.naturalWidth || img.width
        const imgHeight = img.naturalHeight || img.height
        
        console.log('Image loaded for compression:', {
          rawWidth: imgWidth,
          rawHeight: imgHeight,
          exifOrientation: orientation,
          aspectRatio: (imgWidth / imgHeight).toFixed(2)
        })
        
        // Determine if we need to swap dimensions for canvas (orientations 5, 6, 7, 8)
        // These orientations mean the image data is stored rotated, so we need to swap
        const needsDimensionSwap = orientation >= 5 && orientation <= 8
        let canvasWidth = needsDimensionSwap ? imgHeight : imgWidth
        let canvasHeight = needsDimensionSwap ? imgWidth : imgHeight
        
        console.log('Canvas dimensions (after EXIF swap):', {
          canvasWidth,
          canvasHeight,
          needsDimensionSwap
        })
        
        // Calculate scale if exceeds max dimension
        let scale = 1
        if (canvasWidth > maxWidthOrHeight || canvasHeight > maxWidthOrHeight) {
          scale = Math.min(maxWidthOrHeight / canvasWidth, maxWidthOrHeight / canvasHeight)
        }
        
        // Final canvas dimensions (after scaling)
        // Use let so we can update during compression iterations
        let finalWidth = Math.round(canvasWidth * scale)
        let finalHeight = Math.round(canvasHeight * scale)
        
        console.log('Final canvas dimensions:', {
          finalWidth,
          finalHeight,
          scale
        })
        
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
            // Raw image: stored as landscape (e.g., 1920x1080)
            // Display: should be portrait (1080x1920)
            // Canvas: already sized as portrait (finalWidth=1080, finalHeight=1920)
            // Transform: translate right by canvas height, rotate 90° clockwise
            // After rotation, coordinate system is rotated, so we draw with swapped dimensions
            ctx.translate(finalHeight, 0)
            ctx.rotate(Math.PI / 2)
            // Draw: source is imgWidth x imgHeight, destination after rotation is finalHeight x finalWidth
            // This fills the canvas correctly after the rotation transformation
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
        // We MUST get under 4MB to avoid platform 4.5MB limit
        // Note: currentWidth and currentHeight default to finalWidth/finalHeight but are set after this function is defined
        const tryCompress = (currentQuality: number, attemptCount: number = 0, currentWidthParam?: number, currentHeightParam?: number): void => {
          // Use provided dimensions or fall back to finalWidth/finalHeight
          const currentWidth = currentWidthParam ?? finalWidth
          const currentHeight = currentHeightParam ?? finalHeight
          // Prevent infinite loops
          if (attemptCount > 100) {
            reject(new Error(`Failed to compress image below ${(MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(2)}MB after ${attemptCount} attempts`))
            return
          }
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'))
                return
              }
              
              const sizeMB = blob.size / (1024 * 1024)
              
              // If we're under the limit, we're done!
              if (blob.size <= MAX_UPLOAD_SIZE) {
                const compressedFile = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, '.jpg'),
                  {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  }
                )
                
                console.log('Image compressed successfully:', {
                  originalSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
                  compressedSize: (blob.size / (1024 * 1024)).toFixed(2) + 'MB',
                  reduction: ((1 - blob.size / file.size) * 100).toFixed(1) + '%',
                  quality: currentQuality,
                  attempts: attemptCount + 1,
                  originalDimensions: `${imgWidth}x${imgHeight}`,
                  compressedDimensions: `${currentWidth}x${currentHeight}`,
                  orientation: orientation,
                })
                
                resolve(compressedFile)
                return
              }
              
              // Strategy: Try quality reduction first, then force resize if needed
              // If quality is still reducible, try that first
              if (blob.size > MAX_UPLOAD_SIZE && currentQuality > 0.3) {
                // Reduce quality more aggressively
                const newQuality = Math.max(0.3, currentQuality - 0.15)
                console.log(`File still too large (${sizeMB.toFixed(2)}MB), reducing quality to ${newQuality.toFixed(2)}`)
                tryCompress(newQuality, attemptCount + 1, currentWidth, currentHeight)
                return
              }
              
              // If quality is at minimum (0.3) and still too large, FORCE resize
              // Keep resizing until we're under the limit
              if (blob.size > MAX_UPLOAD_SIZE) {
                // Calculate how much we need to reduce
                const targetSize = MAX_UPLOAD_SIZE * 0.95 // Target 95% of limit for safety
                const sizeRatio = Math.sqrt(targetSize / blob.size) // Square root because area scales as width*height
                const reductionFactor = Math.max(0.5, sizeRatio * 0.9) // At least 50% reduction, but usually less aggressive
                
                const newWidth = Math.max(1080, Math.round(currentWidth * reductionFactor))
                const newHeight = Math.max(1080, Math.round(currentHeight * reductionFactor))
                
                // If we've hit minimum dimensions and still too large, we have a problem
                if (newWidth === currentWidth && newHeight === currentHeight && blob.size > MAX_UPLOAD_SIZE) {
                  reject(new Error(
                    `Unable to compress image below ${(MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(2)}MB. ` +
                    `Final size: ${sizeMB.toFixed(2)}MB at minimum dimensions (${newWidth}x${newHeight}). ` +
                    `Please use a smaller or lower resolution image.`
                  ))
                  return
                }
                
                console.log(`File still too large (${sizeMB.toFixed(2)}MB), forcing resize from ${currentWidth}x${currentHeight} to ${newWidth}x${newHeight}`)
                
                // Update canvas dimensions
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
                
                // Try again with resized dimensions and same quality
                tryCompress(currentQuality, attemptCount + 1, newWidth, newHeight)
                return
              }
              
              // This should never be reached, but fail safely
              if (blob.size > MAX_UPLOAD_SIZE) {
                reject(new Error(
                  `Unable to compress image below ${(MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(2)}MB. ` +
                  `Final size: ${sizeMB.toFixed(2)}MB. ` +
                  `Please use a smaller or lower resolution image.`
                ))
                return
              }
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

