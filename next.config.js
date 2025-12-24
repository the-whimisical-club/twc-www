/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for image uploads (default is 10MB)
  // Set to 110MB to allow buffer above the 100MB limit
  experimental: {
    serverActions: {
      bodySizeLimit: '110mb',
    },
    // Increase middleware client body size limit for API routes
    middlewareClientMaxBodySize: '110mb',
  },
  // Note: Vercel has a hard 4.5MB limit for serverless function payloads
  // This cannot be overridden. Large files should be compressed client-side
  // or uploaded directly to storage (bypassing the API route)
}

module.exports = nextConfig

