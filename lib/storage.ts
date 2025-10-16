/**
 * File Storage Utilities - Upload bukti transfer ke Supabase Storage
 * FALLBACK: If storage unavailable, continue without file
 */

async function getAdminClient() {
  try {
    const { getSupabaseAdminClient } = await import("@/lib/supabase/server")
    const client = getSupabaseAdminClient()
    return client
  } catch (error) {
    console.warn("Storage admin client error (continuing without file upload):", error)
    return null
  }
}

export async function uploadTransferProof(
  file: File,
  donationId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    if (!file) {
      return { url: null, error: null } // Allow submission without file for now
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return { url: null, error: "Ukuran file terlalu besar (max 5MB)" }
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: "Tipe file tidak didukung (hanya JPG, PNG, PDF)" }
    }

    const supabase = await getAdminClient()
    
    // If storage not available, continue without file
    if (!supabase) {
      console.warn("Storage not available - submission will continue without file")
      return { url: null, error: null }
    }

    const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1]
    const fileName = `${donationId}-${Date.now()}.${ext}`
    const filePath = `transfer-proofs/${fileName}`

    const { data, error } = await supabase.storage.from("donations").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.warn("Storage upload failed (continuing):", error)
      return { url: null, error: null } // Continue without URL
    }

    const publicUrlData = supabase.storage.from("donations").getPublicUrl(filePath)
    return { url: publicUrlData.data.publicUrl, error: null }
  } catch (error) {
    console.warn("Upload error (continuing):", error)
    return { url: null, error: null } // Allow submission to continue
  }
}

export async function deleteStorageFile(filePath: string) {
  try {
    const supabase = await getAdminClient()
    if (!supabase) {
      return { success: true, error: null }
    }

    const { error } = await supabase.storage.from("donations").remove([filePath])
    if (error) {
      return { success: false, error: "Gagal menghapus file" }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: true, error: null }
  }
}
