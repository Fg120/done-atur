"use client"

/**
 * Public Donation Service - untuk guest users
 * Tidak perlu admin/server-side permissions
 * Menggunakan browser client dengan anon key
 */

import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export async function createDonationPublic(data: any) {
  try {
    const supabase = getSupabaseBrowserClient() as any

    const { data: donation, error } = await supabase.from("donations").insert([data]).select().single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data: donation }
  } catch (error) {
    console.error("Error creating donation:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
