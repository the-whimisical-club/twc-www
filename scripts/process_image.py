#!/usr/bin/env python3
"""
Complete image processor - handles everything:
- Check resolution (must be >= 1080p)
- Handle EXIF orientation (auto-rotate)
- Resize if > 4K (2160p)
- Convert to JPEG
"""

import sys
from PIL import Image, ImageOps
import io

RES_1080P_WIDTH = 1920
RES_1080P_HEIGHT = 1080
RES_4K_WIDTH = 3840
RES_4K_HEIGHT = 2160

def process_image(input_data):
    """Process image: check resolution, handle orientation, resize if needed, convert to JPEG"""
    # Read image from stdin
    img = Image.open(io.BytesIO(input_data))
    
    # Auto-rotate based on EXIF orientation (handles iOS images)
    img = ImageOps.exif_transpose(img)
    
    width, height = img.size
    
    # Check if resolution is less than 1080p
    if width < RES_1080P_WIDTH and height < RES_1080P_HEIGHT:
        sys.stderr.write("RESOLUTION_TOO_LOW\n")
        sys.exit(1)
    
    # Check if needs resizing (only if > 4K/2160p)
    needs_resize = width > RES_4K_WIDTH or height > RES_4K_HEIGHT
    
    if needs_resize:
        # Calculate scale to fit within 4K
        scale = min(RES_4K_WIDTH / width, RES_4K_HEIGHT / height)
        new_width = int(width * scale)
        new_height = int(height * scale)
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Convert to RGB if needed (removes alpha channel, handles grayscale)
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Save as JPEG to stdout (ALWAYS JPEG, NEVER WebP)
    # Use binary mode and explicitly specify JPEG format
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=95, optimize=True)
    jpeg_data = output.getvalue()
    
    # Verify it's actually JPEG (check magic bytes: FF D8)
    if len(jpeg_data) < 2 or jpeg_data[0] != 0xFF or jpeg_data[1] != 0xD8:
        sys.stderr.write(f"ERROR: Output is not JPEG! First bytes: {jpeg_data[:4] if len(jpeg_data) >= 4 else jpeg_data}\n")
        sys.exit(1)
    
    # Write to stdout in binary mode
    sys.stdout.buffer.write(jpeg_data)
    sys.stdout.buffer.flush()  # Ensure all data is written

if __name__ == '__main__':
    input_data = sys.stdin.buffer.read()
    process_image(input_data)

