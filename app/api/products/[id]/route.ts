import { NextResponse } from "next/server"

import { applyRateLimit, formatRateLimitHeaders } from "@/lib/rate-limit"
import { createSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"
import { adminUpdateProductSchema, userIdParamSchema } from "@/lib/validators"
import type { Profile } from "@/lib/auth"

export const runtime = "nodejs"

const RATE_LIMIT_WINDOW = 60_000
const READ_RATE_LIMIT = 60
const UPDATE_RATE_LIMIT = 20
const DELETE_RATE_LIMIT = 10

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

export async function GET(request: Request, context: { params: { id: string } }) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({ key: `products:read:${identity}`, limit: READ_RATE_LIMIT, windowMs: RATE_LIMIT_WINDOW })
  const headers = formatRateLimitHeaders(rate)
  if (!rate.success) return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429, headers })

  const adminResult = await ensureAdmin()
  if ("status" in adminResult) return NextResponse.json({ error: adminResult.message }, { status: adminResult.status, headers })

  const idParse = userIdParamSchema.safeParse({ id: context.params.id })
  if (!idParse.success) return NextResponse.json({ error: "ID tidak valid" }, { status: 422, headers })

  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await (supabaseAdmin as any)
    .from("products")
    .select("id, user_id, title, condition, price, stock, status, photo_urls, created_at, updated_at")
    .eq("id", idParse.data.id)
    .single()

  if (error) {
    if ((error as any).code === "PGRST116") return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404, headers })
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500, headers })
  }

  return NextResponse.json({ data }, { status: 200, headers })
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({ key: `products:update:${identity}`, limit: UPDATE_RATE_LIMIT, windowMs: RATE_LIMIT_WINDOW })
  const headers = formatRateLimitHeaders(rate)
  if (!rate.success) return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429, headers })

  const adminResult = await ensureAdmin()
  if ("status" in adminResult) return NextResponse.json({ error: adminResult.message }, { status: adminResult.status, headers })

  const idParse = userIdParamSchema.safeParse({ id: context.params.id })
  if (!idParse.success) return NextResponse.json({ error: "ID tidak valid" }, { status: 422, headers })

  const payload = await request.json().catch(() => null)
  const parsed = adminUpdateProductSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validasi gagal", details: parsed.error.flatten().fieldErrors }, { status: 422, headers })
  }

  const updateData: Record<string, any> = {}
  for (const key of ["title", "user_id", "condition", "price", "stock", "status", "photo_urls"] as const) {
    if (typeof (parsed.data as any)[key] !== "undefined") {
      ;(updateData as any)[key] = (parsed.data as any)[key]
    }
  }
  if (Object.keys(updateData).length === 0) return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400, headers })

  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await (supabaseAdmin as any)
    .from("products")
    .update(updateData)
    .eq("id", idParse.data.id)
    .select("id, user_id, title, condition, price, stock, status, photo_urls, created_at, updated_at")
    .single()

  if (error) return NextResponse.json({ error: "Gagal memperbarui produk" }, { status: 500, headers })
  return NextResponse.json({ data }, { status: 200, headers })
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({ key: `products:delete:${identity}`, limit: DELETE_RATE_LIMIT, windowMs: RATE_LIMIT_WINDOW })
  const headers = formatRateLimitHeaders(rate)
  if (!rate.success) return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429, headers })

  const adminResult = await ensureAdmin()
  if ("status" in adminResult) return NextResponse.json({ error: adminResult.message }, { status: adminResult.status, headers })

  const idParse = userIdParamSchema.safeParse({ id: context.params.id })
  if (!idParse.success) return NextResponse.json({ error: "ID tidak valid" }, { status: 422, headers })

  // Attempt to delete associated files if any
  const supabaseAdmin = getSupabaseAdminClient()

  // Load product to get photo URLs
  const { data: product } = await (supabaseAdmin as any)
    .from("products")
    .select("photo_urls")
    .eq("id", idParse.data.id)
    .single()

  if (product?.photo_urls && Array.isArray(product.photo_urls) && product.photo_urls.length > 0) {
    try {
      const paths = product.photo_urls
        .map((u: string) => {
          try {
            const url = new URL(u)
            const marker = "/object/public/products/"
            const idx = url.pathname.indexOf(marker)
            if (idx >= 0) return url.pathname.substring(idx + marker.length)
            return null
          } catch {
            return null
          }
        })
        .filter((p: string | null): p is string => !!p)
      if (paths.length > 0) {
        await (supabaseAdmin as any).storage.from("products").remove(paths)
      }
    } catch {
      // ignore storage removal errors
    }
  }

  const { error } = await (supabaseAdmin as any)
    .from("products")
    .delete()
    .eq("id", idParse.data.id)

  if (error) return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500, headers })
  return NextResponse.json({ success: true }, { status: 200, headers })
}

