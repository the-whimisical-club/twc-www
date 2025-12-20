// Next.js middleware file (not Bun middleware)
// This file is required by Next.js for route-level middleware
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    // Create Supabase client and get response object
    const { supabase, response } = createClient(request)

    // This refreshes the session cookie automatically
    // Calling getUser() triggers the session refresh
    await supabase.auth.getUser()

    // You can add route protection logic here if needed

    return response
  } catch (error) {
    // If there's an error, return a response without breaking the request
    console.error('Middleware error:', error)
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
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

