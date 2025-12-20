/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Worker for R2 Image Storage
 * 
 * Handles:
 * - PUT: Upload images to R2 bucket
 * - GET: Serve images from R2 bucket via public URLs
 * 
 * No authentication required (for now)
 */

export interface Env {
  BUCKET: R2Bucket;
}

// Allowed image MIME types (photos only, no videos)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

// Sanitize filename to prevent path traversal while preserving user folders
function sanitizeFilename(filename: string): string {
  // Split into path components
  const parts = filename.split('/');
  // Sanitize each part individually to prevent path traversal
  const sanitizedParts = parts.map(part => {
    // Remove any dangerous characters but keep alphanumeric, dots, underscores, hyphens
    return part.replace(/[^a-zA-Z0-9._-]/g, '');
  }).filter(part => part.length > 0); // Remove empty parts
  
  // Rejoin with forward slashes (this preserves user folder structure)
  return sanitizedParts.join('/');
}

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // GET: Serve image from R2
    if (method === 'GET') {
      // Remove leading slash from pathname
      const key = pathname.slice(1);
      
      if (!key) {
        return new Response(
          JSON.stringify({ 
            message: 'Image Worker API',
            usage: {
              upload: 'PUT / with image file in body',
              serve: 'GET /filename.jpg to retrieve an image'
            }
          }),
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      try {
        const object = await env.BUCKET.get(key);
        
        if (!object) {
          return new Response('Image not found', { status: 404 });
        }

        // Return image with appropriate headers
        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        console.error('Error fetching image:', error);
        return new Response('Internal server error', { status: 500 });
      }
    }

    // PUT: Upload image to R2
    if (method === 'PUT') {
      const contentType = request.headers.get('Content-Type') || 'image/webp';
      
      // Validate content type
      if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return new Response(
          JSON.stringify({ 
            error: `Invalid content type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` 
          }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Get file size from Content-Length header
      const contentLength = request.headers.get('Content-Length');
      if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ 
            error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
          }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Use filename from path if provided, otherwise generate one
      let filename: string;
      const pathKey = pathname.slice(1); // Remove leading slash
      
      if (pathKey) {
        // Use provided filename (sanitized)
        filename = sanitizeFilename(pathKey);
        // Ensure it ends with .webp
        if (!filename.endsWith('.webp')) {
          filename = filename.replace(/\.[^.]+$/, '') + '.webp';
        }
      } else {
        // Generate unique filename: timestamp-random.webp
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        filename = `${timestamp}-${random}.webp`;
      }

      try {
        // Read the request body
        const body = await request.arrayBuffer();
        
        // Validate actual file size
        if (body.byteLength > MAX_FILE_SIZE) {
          return new Response(
            JSON.stringify({ 
              error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
            }),
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        // Upload to R2 (always use image/webp content type)
        await env.BUCKET.put(filename, body, {
          httpMetadata: {
            contentType: 'image/webp',
          },
        });

        // Return public URL
        const publicUrl = `${url.origin}/${filename}`;
        
        return new Response(
          JSON.stringify({ 
            url: publicUrl,
            filename: filename,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (error) {
        console.error('Error uploading image:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to upload image' }),
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // Method not allowed
    return new Response('Method not allowed', { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};

