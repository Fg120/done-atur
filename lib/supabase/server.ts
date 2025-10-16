import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/types/database"

// Import cookies hanya di dalam function yang dibutuhkan
let adminClient: SupabaseClient<Database> | null = null

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

function getServiceRoleKey() {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!key) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
      return null
    }
    return key
  } catch (error) {
    console.error("Error getting service role key:", error)
    return null
  }
}

export function createSupabaseServerClient() {
  // Dynamic import untuk menghindari error di pages/
  const { cookies } = require("next/headers")
  const { createServerClient } = require("@supabase/ssr")

  const cookieStore = cookies()

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 })
      },
    },
  }) as SupabaseClient<Database>
}

export function getSupabaseAdminClient() {
  if (adminClient) {
    return adminClient
  }

  const serviceKey = getServiceRoleKey()
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations")
  }

  adminClient = createClient<Database>(getSupabaseUrl(), serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return adminClient
}
