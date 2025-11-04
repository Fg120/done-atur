import { createClient } from "@supabase/supabase-js"
import type { AdminCreateAccountabilityInput, AdminUpdateAccountabilityInput } from "@/lib/validators"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function createAccountability(data: AdminCreateAccountabilityInput, userId: string) {
  try {
    const { data: result, error } = await supabase
      .from("accountability")
      .insert({
        location: data.location,
        activity_date: data.activity_date,
        description: data.description,
        donation_ids: data.donation_ids,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" }
  }
}

export async function getAccountabilities(filters?: { location?: string; dateFrom?: string; dateTo?: string }) {
  try {
    let query = supabase
      .from("accountability")
      .select("id, location, activity_date, description, donation_ids, created_by, created_at, updated_at")
      .order("activity_date", { ascending: false })

    if (filters?.location) {
      query = query.ilike("location", `%${filters.location}%`)
    }

    if (filters?.dateFrom) {
      query = query.gte("activity_date", filters.dateFrom)
    }

    if (filters?.dateTo) {
      query = query.lte("activity_date", filters.dateTo)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" }
  }
}

export async function getAccountabilityById(id: string) {
  try {
    const { data, error } = await supabase
      .from("accountability")
      .select("id, location, activity_date, description, donation_ids, created_by, created_at, updated_at")
      .eq("id", id)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" }
  }
}

export async function updateAccountability(id: string, data: AdminUpdateAccountabilityInput) {
  try {
    const updateData: any = {}

    if (data.location !== undefined) updateData.location = data.location
    if (data.activity_date !== undefined) updateData.activity_date = data.activity_date
    if (data.description !== undefined) updateData.description = data.description
    if (data.donation_ids !== undefined) updateData.donation_ids = data.donation_ids
    updateData.updated_at = new Date().toISOString()

    const { data: result, error } = await supabase
      .from("accountability")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" }
  }
}

export async function deleteAccountability(id: string) {
  try {
    const { error } = await supabase
      .from("accountability")
      .delete()
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" }
  }
}
