import { NextResponse } from "next/server"

import { applyRateLimit, formatRateLimitHeaders } from "@/lib/rate-limit"
import { createSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"
import { adminUpdateUserSchema, userIdParamSchema } from "@/lib/validators"
import type { Profile } from "@/lib/auth"

export const runtime = "nodejs"

const RATE_LIMIT_WINDOW = 60_000
const DETAIL_RATE_LIMIT = 120
const MUTATION_RATE_LIMIT = 30

function getClientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const [ip] = forwarded.split(",").map((value) => value.trim()).filter(Boolean)
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

  if (!profile || (profile as any).role !== "admin") {
    return { status: 403, message: "Forbidden" }
  }

  return { profile: profile as any }
}

function parseParams(params: { id: string }) {
  const parsed = userIdParamSchema.safeParse(params)
  if (!parsed.success) {
    return { error: { status: 422, message: "ID tidak valid" } }
  }
  return { id: parsed.data.id }
}

export async function GET(request: Request, context: { params: { id: string } }) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({
    key: `users:get:${identity}`,
    limit: DETAIL_RATE_LIMIT,
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

  const parsed = parseParams(context.params)
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error.message }, {
      status: parsed.error.status,
      headers,
    })
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, name, role, created_at, updated_at")
    .eq("id", parsed.id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, {
        status: 404,
        headers,
      })
    }

    return NextResponse.json({ error: "Gagal memuat data" }, {
      status: 500,
      headers,
    })
  }

  return NextResponse.json({ data }, {
    status: 200,
    headers,
  })
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({
    key: `users:patch:${identity}`,
    limit: MUTATION_RATE_LIMIT,
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

  const parsedParams = parseParams(context.params)
  if ("error" in parsedParams) {
    return NextResponse.json({ error: parsedParams.error.message }, {
      status: parsedParams.error.status,
      headers,
    })
  }

  const payload = await request.json().catch(() => null)
  const parsedBody = adminUpdateUserSchema.safeParse(payload)

  if (!parsedBody.success) {
    return NextResponse.json({
      error: "Validasi gagal",
      details: parsedBody.error.flatten().fieldErrors,
    }, {
      status: 422,
      headers,
    })
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(parsedBody.data)
    .eq("id", parsedParams.id)
    .select("id, email, name, role, created_at, updated_at")
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, {
        status: 404,
        headers,
      })
    }

    return NextResponse.json({ error: "Gagal memperbarui data" }, {
      status: 500,
      headers,
    })
  }

  return NextResponse.json({ data }, {
    status: 200,
    headers,
  })
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const identity = getClientIdentifier(request)
  const rate = applyRateLimit({
    key: `users:delete:${identity}`,
    limit: MUTATION_RATE_LIMIT,
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

  const parsedParams = parseParams(context.params)
  if ("error" in parsedParams) {
    return NextResponse.json({ error: parsedParams.error.message }, {
      status: parsedParams.error.status,
      headers,
    })
  }

  const supabaseAdmin = getSupabaseAdminClient()
  const { error } = await supabaseAdmin.auth.admin.deleteUser(parsedParams.id)

  if (error) {
    if (error.message.includes("User not found")) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, {
        status: 404,
        headers,
      })
    }

    return NextResponse.json({ error: "Gagal menghapus pengguna" }, {
      status: 500,
      headers,
    })
  }

  return new NextResponse(null, {
    status: 204,
    headers,
  })
}
