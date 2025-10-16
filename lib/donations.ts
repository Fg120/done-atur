"use server"

// Lazy import untuk menghindari error saat build
async function getAdminClient() {
  try {
    const { getSupabaseAdminClient } = await import("@/lib/supabase/server")
    return getSupabaseAdminClient()
  } catch (error) {
    console.error("Failed to get admin client:", error)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured")
  }
}

async function deleteStorageFile(path: string) {
  try {
    const { deleteStorageFile: deleteFile } = await import("@/lib/storage")
    return await deleteFile(path)
  } catch (error) {
    console.error("Failed to delete storage file:", error)
    return { success: false, error: "Storage not available" }
  }
}

export async function createDonation(data: any) {
  try {
    const supabase = await getAdminClient() as any

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

export async function getDonations(filters?: { status?: string; email?: string }) {
  try {
    const supabase = await getAdminClient() as any

    let query = supabase.from("donations").select("*")

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.email) {
      query = query.eq("donor_email", filters.email)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching donations:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getDonationById(id: string) {
  try {
    const supabase = await getAdminClient() as any

    const { data, error } = await supabase.from("donations").select("*").eq("id", id).single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching donation:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updateDonationStatus(id: string, status: string) {
  try {
    const supabase = await getAdminClient() as any

    const { data, error } = await supabase
      .from("donations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error updating donation:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updateDonation(id: string, updateData: any) {
  try {
    const supabase = await getAdminClient() as any

    const { data, error } = await supabase
      .from("donations")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error updating donation:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function deleteDonation(id: string) {
  try {
    const supabase = await getAdminClient() as any

    // Get donation data to find transfer proof file
    const { data: donation, error: fetchError } = await supabase
      .from("donations")
      .select("transfer_proof_url")
      .eq("id", id)
      .single()

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    // Delete transfer proof file dari storage jika ada
    if (donation?.transfer_proof_url) {
      // Extract file path dari public URL
      const url = new URL(donation.transfer_proof_url)
      const filePath = url.pathname.split("/storage/v1/object/public/donations/")[1]

      if (filePath) {
        await deleteStorageFile(`transfer-proofs/${filePath}`)
      }
    }

    // Delete donation record
    const { error } = await supabase.from("donations").delete().eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting donation:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
