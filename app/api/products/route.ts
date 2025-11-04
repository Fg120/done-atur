import { NextResponse } from "next/server"

import { applyRateLimit, formatRateLimitHeaders } from "@/lib/rate-limit"
import { createSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"
import { adminCreateProductSchema, productQuerySchema } from "@/lib/validators"
import type { Profile } from "@/lib/auth"

export const runtime = "nodejs"

const RATE_LIMIT_WINDOW = 60_000
const LIST_RATE_LIMIT = 60
const CREATE_RATE_LIMIT = 15

function getClientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const [ip] = forwarded.split(",").map((v) => v.trim()).filter(Boolean)
    if (ip) return ip
  }
  return request.headers.get("x-real-ip") ?? "unknown"
}

async function ensureAdmin(): Promise<{ profile: Profile } | { status: number; message: string }> {
  const supabase = createSupabaseServerClient()
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) return { status: 500, message: "Gagal memuat sesi" }
  if (!session) return { status: 401, message: "Unauthorized" }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", session.user.id)
    .single()

  if (profileError && profileError.code !== "PGRST116") {
    return { status: 500, message: "Gagal memuat profil" }
  }
  if (!profile) return { status: 403, message: "Profile not found" }
  const typed = profile as any
  if (typed.role !== "admin") return { status: 403, message: "Forbidden" }
  return { profile: typed }
}

export async function GET(request: Request) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({ key: `products:list:${identity}`, limit: LIST_RATE_LIMIT, windowMs: RATE_LIMIT_WINDOW })
  const headers = formatRateLimitHeaders(rate)
  if (!rate.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429, headers })
  }

  const adminResult = await ensureAdmin()
  if ("status" in adminResult) {
    return NextResponse.json({ error: adminResult.message }, { status: adminResult.status, headers })
  }

  const url = new URL(request.url)
  const parse = productQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))
  if (!parse.success) {
    return NextResponse.json({ error: "Parameter tidak valid", details: parse.error.flatten().fieldErrors }, { status: 422, headers })
  }

  const { limit, page, q, sortBy, order, status, userId } = parse.data
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabaseAdmin = getSupabaseAdminClient()
  let query = (supabaseAdmin as any)
    .from("products")
    .select("id, user_id, title, condition, price, stock, status, photo_urls, created_at, updated_at", { count: "exact" })
    .order(sortBy, { ascending: order === "asc" })
    .range(from, to)

  if (q) {
    const search = `%${q.replace(/[%_]/g, "\\$&").replace(/,/g, "")}%`
    query = query.ilike("title", search)
  }
  if (status) {
    query = query.eq("status", status)
  }
  if (userId) {
    query = query.eq("user_id", userId)
  }

  const { data, error, count } = await query
  if (error) {
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500, headers })
  }

  return NextResponse.json({ data: { items: data ?? [], total: count ?? 0, page, pageSize: limit } }, { status: 200, headers })
}

export async function POST(request: Request) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({ key: `products:create:${identity}`, limit: CREATE_RATE_LIMIT, windowMs: RATE_LIMIT_WINDOW })
  const headers = formatRateLimitHeaders(rate)
  if (!rate.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429, headers })
  }

  const adminResult = await ensureAdmin()
  if ("status" in adminResult) {
    return NextResponse.json({ error: adminResult.message }, { status: adminResult.status, headers })
  }

  const payload = await request.json().catch(() => null)
  const parsed = adminCreateProductSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten().fieldErrors }, { status: 422, headers })
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const insertData = {
    title: parsed.data.title,
    user_id: parsed.data.user_id,
    condition: parsed.data.condition,
    price: parsed.data.price,
    stock: parsed.data.stock ?? 0,
    status: parsed.data.status ?? "active",
    photo_urls: parsed.data.photo_urls ?? null,
  }

  const { data, error } = await (supabaseAdmin as any)
    .from("products")
    .insert([insertData])
    .select("id, user_id, title, condition, price, stock, status, photo_urls, created_at, updated_at")
    .single()

  if (error) {
    return NextResponse.json({ error: "Gagal membuat produk" }, { status: 500, headers })
  }

  return NextResponse.json({ data }, { status: 201, headers })
}

