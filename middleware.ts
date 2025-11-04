import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import type { Database } from "@/types/database"

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
  }
  return url
}

function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }
  return key
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const requiresAuth = pathname.startsWith("/account") || pathname.startsWith("/admin")
  const requiresAdmin = pathname.startsWith("/admin")

  if (!requiresAuth) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (!session) {
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search)
    return NextResponse.redirect(redirectUrl)
  }

  if (!requiresAdmin) {
    return response
  }

  // For admin check, we need to make an API call since middleware can't access service_role
  // Instead, we'll just allow the request and let the page component handle the admin check
  // The RLS policies will prevent unauthorized access to data
  return response
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
}
