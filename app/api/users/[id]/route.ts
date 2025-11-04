import { NextResponse } from "next/server"

import { applyRateLimit, formatRateLimitHeaders } from "@/lib/rate-limit"
import { createSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"
import { adminUpdateUserSchema, userIdParamSchema } from "@/lib/validators"
import type { Profile } from "@/lib/auth"

export const runtime = "nodejs"

const RATE_LIMIT_WINDOW = 60_000
const READ_RATE_LIMIT = 60
const UPDATE_RATE_LIMIT = 20
const DELETE_RATE_LIMIT = 10

function getClientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const [ip] = forwarded
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
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

  if (sessionError) {
    return { status: 500, message: "Gagal memuat sesi" }
  }

  if (!session) {
    return { status: 401, message: "Unauthorized" }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", session.user.id)
    .single()

  if (profileError && profileError.code !== "PGRST116") {
    return { status: 500, message: "Gagal memuat profil" }
  }

  if (!profile) {
    return { status: 403, message: "Profile not found" }
  }

  const typedProfile = profile as any
  if (typedProfile.role !== "admin") {
    return { status: 403, message: "Forbidden" }
  }

  return { profile: typedProfile }
}

export async function GET(request: Request, context: { params: { id: string } }) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({
    key: `users:read:${identity}`,
    limit: READ_RATE_LIMIT,
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

  const idParse = userIdParamSchema.safeParse({ id: context.params.id })
  if (!idParse.success) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 422, headers })
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await (supabaseAdmin as any)
    .from("profiles")
    .select("id, email, full_name, role, created_at, updated_at")
    .eq("id", idParse.data.id)
    .single()

  if (error) {
    if ((error as any).code === "PGRST116") {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404, headers })
    }
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500, headers })
  }

  return NextResponse.json({ data }, { status: 200, headers })
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({
    key: `users:update:${identity}`,
    limit: UPDATE_RATE_LIMIT,
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

  const idParse = userIdParamSchema.safeParse({ id: context.params.id })
  if (!idParse.success) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 422, headers })
  }

  const payload = await request.json().catch(() => null)
  const parsed = adminUpdateUserSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({
      error: "Validasi gagal",
      details: parsed.error.flatten().fieldErrors,
    }, { status: 422, headers })
  }

  const updateData: Record<string, any> = {}
  if (typeof parsed.data.full_name !== "undefined") {
    updateData.full_name = parsed.data.full_name
  }
  if (typeof parsed.data.role !== "undefined") {
    updateData.role = parsed.data.role
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400, headers })
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await (supabaseAdmin as any)
    .from("profiles")
    .update(updateData)
    .eq("id", idParse.data.id)
    .select("id, email, full_name, role, created_at, updated_at")
    .single()

  if (error) {
    return NextResponse.json({ error: "Gagal memperbarui pengguna" }, { status: 500, headers })
  }

  return NextResponse.json({ data }, { status: 200, headers })
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({
    key: `users:delete:${identity}`,
    limit: DELETE_RATE_LIMIT,
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

  const idParse = userIdParamSchema.safeParse({ id: context.params.id })
  if (!idParse.success) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 422, headers })
  }

  // Prevent self-deletion for safety
  if (adminResult.profile.id === idParse.data.id) {
    return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 400, headers })
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const { error } = await supabaseAdmin.auth.admin.deleteUser(idParse.data.id)

  if (error) {
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500, headers })
  }

  // profiles row will be deleted via ON DELETE CASCADE
  return NextResponse.json({ success: true }, { status: 200, headers })
}

