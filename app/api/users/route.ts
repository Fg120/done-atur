import { NextResponse } from "next/server"

import { applyRateLimit, formatRateLimitHeaders } from "@/lib/rate-limit"
import { createSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"
import { adminCreateUserSchema, userQuerySchema } from "@/lib/validators"
import type { Profile } from "@/lib/auth"
import type { Database } from "@/types/database"

export const runtime = "nodejs"

const RATE_LIMIT_WINDOW = 60_000
const LIST_RATE_LIMIT = 60
const CREATE_RATE_LIMIT = 10

function getClientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const [ip] = forwarded.split(",").map((value) => value.trim()).filter(Boolean)
    if (ip) return ip
  }
  return request.headers.get("x-real-ip") ?? "unknown"
}

function buildSearchFilter(raw: string) {
  const sanitized = raw.replace(/[%_]/g, "\\$&").replace(/,/g, "")
  return `%${sanitized}%`
}

async function ensureAdmin(): Promise<{ profile: Profile } | { status: number; message: string }> {
  const supabase = createSupabaseServerClient()
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  console.log("Session check - has session:", !!session, "error:", sessionError?.message)

  if (sessionError) {
    console.error("Session error:", sessionError)
    return { status: 500, message: "Gagal memuat sesi" }
  }

  if (!session) {
    console.log("No session found - user not authenticated")
    return { status: 401, message: "Unauthorized" }
  }

  console.log("Checking admin profile for user:", session.user.id)

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", session.user.id)
    .single()

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Profile error:", profileError)
    return { status: 500, message: "Gagal memuat profil" }
  }

  if (!profile) {
    return { status: 403, message: "Profile not found" }
  }

  // Temporary workaround for TypeScript issue
  const typedProfile = profile as any
  if (typedProfile.role !== "admin") {
    return { status: 403, message: "Forbidden" }
  }

  return { profile: typedProfile }
}

export async function GET(request: Request) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({
    key: `users:list:${identity}`,
    limit: LIST_RATE_LIMIT,
    windowMs: RATE_LIMIT_WINDOW,
  })

  const headers = formatRateLimitHeaders(rate)

  if (!rate.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan" }, {
      status: 429,
      headers,
    })
  }

  const adminResult = await ensureAdmin()
  if ("status" in adminResult) {
    return NextResponse.json({ error: adminResult.message }, {
      status: adminResult.status,
      headers,
    })
  }

  const url = new URL(request.url)
  const parseResult = userQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))

  if (!parseResult.success) {
    return NextResponse.json({
      error: "Parameter tidak valid",
      details: parseResult.error.flatten().fieldErrors,
    }, {
      status: 422,
      headers,
    })
  }

  const { limit, page, q, sortBy, order } = parseResult.data
  const supabaseAdmin = getSupabaseAdminClient()

  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, role, created_at, updated_at", { count: "exact" })
    .order(sortBy, { ascending: order === "asc" })
    .range(from, to)

  if (q) {
    const search = buildSearchFilter(q)
    query = query.or(`email.ilike.${search},full_name.ilike.${search}`)
  }

  // Get profiles data
  const { data, error, count } = await query

  if (error) {
    console.error("Database error:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    
    return NextResponse.json({ 
      error: "Gagal memuat data", 
      details: error.message,
      code: error.code 
    }, {
      status: 500,
      headers,
    })
  }

  return NextResponse.json({
    data: {
      items: data ?? [],
      total: count ?? 0,
      page,
      pageSize: limit,
    },
  }, {
    status: 200,
    headers,
  })
}

export async function POST(request: Request) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({
    key: `users:create:${identity}`,
    limit: CREATE_RATE_LIMIT,
    windowMs: RATE_LIMIT_WINDOW,
  })
  const headers = formatRateLimitHeaders(rate)

  if (!rate.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan" }, {
      status: 429,
      headers,
    })
  }

  const adminResult = await ensureAdmin()
  if ("status" in adminResult) {
    return NextResponse.json({ error: adminResult.message }, {
      status: adminResult.status,
      headers,
    })
  }

  const payload = await request.json().catch(() => null)

  const parsed = adminCreateUserSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({
      error: "Validasi gagal",
      details: parsed.error.flatten().fieldErrors,
    }, {
      status: 422,
      headers,
    })
  }

  const { email, full_name, role } = parsed.data
  const supabaseAdmin = getSupabaseAdminClient()

  const redirectHost = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name },
    redirectTo: `${redirectHost}/auth/login`,
  })

  if (inviteError) {
    if (inviteError.message.includes("already registered")) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, {
        status: 409,
        headers,
      })
    }

    return NextResponse.json({ error: "Gagal membuat pengguna" }, {
      status: 500,
      headers,
    })
  }

  const user = inviteData.user

  if (!user) {
    return NextResponse.json({ error: "Gagal membuat pengguna" }, {
      status: 500,
      headers,
    })
  }

  // Update profile with full_name and role
  const { data: profile, error: updateError } = await (supabaseAdmin as any)
    .from("profiles")
    .update({
      full_name,
      role: role ?? "user",
    })
    .eq("id", user.id)
    .select("id, email, full_name, role")
    .single()

  if (updateError) {
    console.error("Profile update error:", updateError)
    return NextResponse.json({ error: "Gagal menyimpan profil" }, {
      status: 500,
      headers,
    })
  }

  return NextResponse.json({ data: profile }, {
    status: 201,
    headers,
  })
}
