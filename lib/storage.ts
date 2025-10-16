import { getSupabaseAdminClient } from "./supabase/server"

/**
 * Upload bukti transfer ke Supabase Storage
 * @param file - File yang akan diupload
 * @param donationId - ID donasi untuk naming
 * @returns Public URL atau null jika gagal
 */
export async function uploadTransferProof(
  file: File,
  donationId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Validasi file
    if (!file) {
      return { url: null, error: "File tidak ditemukan" }
    }

    // Validasi ukuran (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { url: null, error: "Ukuran file terlalu besar (max 5MB)" }
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return { url: null, error: "Tipe file tidak didukung (hanya JPG, PNG, PDF)" }
    }

    // Generate nama file unik
    const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1]
    const fileName = `${donationId}-${Date.now()}.${ext}`
    const filePath = `transfer-proofs/${fileName}`

    // Upload ke Supabase Storage
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase.storage.from("donations").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Storage upload error:", error)
      return { url: null, error: "Gagal mengupload file" }
    }

    // Generate public URL
    const publicUrlData = supabase.storage.from("donations").getPublicUrl(filePath)

    return { url: publicUrlData.data.publicUrl, error: null }
  } catch (error) {
    console.error("Upload transfer proof error:", error)
    return {
      url: null,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat mengupload",
    }
  }
}

/**
 * Delete file dari Supabase Storage
 * @param filePath - Path file di storage
 */
export async function deleteStorageFile(filePath: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.storage.from("donations").remove([filePath])

    if (error) {
      console.error("Storage delete error:", error)
      return { success: false, error: "Gagal menghapus file" }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Delete file error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat menghapus",
    }
  }
}
