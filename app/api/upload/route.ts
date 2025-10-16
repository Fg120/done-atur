import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const donationId = formData.get("donationId") as string

    if (!file || !donationId) {
      return NextResponse.json(
        { error: "File dan donationId diperlukan" },
        { status: 400 }
      )
    }

    // Validasi file
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File terlalu besar (max 5MB)" },
        { status: 400 }
      )
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung" },
        { status: 400 }
      )
    }

    // Get admin client di server-side
    try {
      const { getSupabaseAdminClient } = await import("@/lib/supabase/server")
      const supabase = getSupabaseAdminClient() as any

      const buffer = await file.arrayBuffer()
      const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1]
      const fileName = `${donationId}-${Date.now()}.${ext}`
      const filePath = `transfer-proofs/${fileName}`

      const { data, error } = await supabase.storage
        .from("donations")
        .upload(filePath, new Uint8Array(buffer), {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        })

      if (error) {
        console.error("Storage error:", error)
        return NextResponse.json(
          { error: "Gagal upload file" },
          { status: 500 }
        )
      }

      // Get public URL
      const publicUrlData = supabase.storage
        .from("donations")
        .getPublicUrl(filePath)

      return NextResponse.json({
        success: true,
        url: publicUrlData.data.publicUrl,
      })
    } catch (err) {
      console.error("Admin client error:", err)
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
