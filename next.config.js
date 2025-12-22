/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for image uploads (default is 10MB)
  // Set to 110MB to allow buffer above the 100MB limit (images will be compressed to WebP)
  experimental: {
    serverActions: {
      bodySizeLimit: '110mb',
    },
    // Increase middleware client body size limit for API routes
    middlewareClientMaxBodySize: '110mb',
  },
}

module.exports = nextConfig

