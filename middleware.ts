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

function getSupabaseServiceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
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

  // Use service role key to check admin status (bypasses RLS)
  const supabaseService = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseServiceKey(),
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

  const { data: profile, error: profileError } = await supabaseService
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (profileError && profileError.code !== "PGRST116") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!profile || (profile as any).role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
}
