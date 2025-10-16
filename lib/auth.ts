import { redirect } from "next/navigation"

import { createSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"
import type { UserRole } from "@/types/database"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export async function getSession() {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session ?? null
}

export async function getCurrentProfile() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error && error.code !== "PGRST116") {
    throw error
  }

  return data ?? null
}

export async function requireUser(options?: { redirectTo?: string }) {
  const session = await getSession()
  if (!session) {
    redirect(options?.redirectTo ?? "/auth/login")
  }

  return session
}

export async function requireRole(roles: UserRole | UserRole[], options?: { redirectTo?: string }) {
  const allowed = Array.isArray(roles) ? roles : [roles]
  const profile = await getCurrentProfile()

  if (!profile || !allowed.includes(profile.role)) {
    redirect(options?.redirectTo ?? "/")
  }

  return profile
}

export async function getProfileById(id: string) {
  const adminClient = getSupabaseAdminClient()
  const { data, error } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw error
  }

  return data
}
