// Next.js middleware file (not Bun middleware)
// This file is required by Next.js for route-level middleware
import { type NextRequest } from 'next/server'
import { createClient } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // This refreshes the session cookie automatically
  const response = createClient(request)

  // The createClient utility handles session refresh automatically
  // You can add route protection logic here if needed

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

