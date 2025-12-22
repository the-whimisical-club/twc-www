import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Generate a perfect test image:
 * - 3840x2160 (exactly 4K) - won't be resized
 * - JPEG format - won't be converted
 * - High quality - tests preservation
 */

async function generateTestImage() {
  const width = 3840
  const height = 2160
  
  // Create a test image with a gradient pattern (so it's not just solid color)
  // This ensures it's a "real" image that would normally be processed
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
          <stop offset="50%" style="stop-color:rgb(0,255,0);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <text x="50%" y="50%" font-size="120" fill="white" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-weight="bold">
        TEST IMAGE 4K JPEG
      </text>
    </svg>
  `

  // Convert SVG to JPEG using Sharp
  const jpegBuffer = await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({
      quality: 95,
      mozjpeg: true,
    })
    .toBuffer()

  // Save to project root
  const outputPath = join(process.cwd(), 'test-image-4k.jpg')
  writeFileSync(outputPath, jpegBuffer)

  console.log(`✅ Generated test image: ${outputPath}`)
  console.log(`   Dimensions: ${width}x${height} (4K)`)
  console.log(`   Format: JPEG`)
  console.log(`   Size: ${(jpegBuffer.length / 1024 / 1024).toFixed(2)} MB`)
  console.log(`   This image should NOT be resized or converted!`)
}

generateTestImage().catch(console.error)

