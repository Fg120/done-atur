import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const productId = formData.get("productId") as string

    if (!file || !productId) {
      return NextResponse.json({ error: "File dan productId diperlukan" }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File terlalu besar (max 5MB)" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipe file tidak didukung" }, { status: 400 })
    }

    try {
      const { getSupabaseAdminClient } = await import("@/lib/supabase/server")
      const supabase = getSupabaseAdminClient() as any

      const buffer = await file.arrayBuffer()
      const ext = file.type.split("/")[1]
      const fileName = `${productId}-${Date.now()}.${ext}`
      const filePath = `images/${fileName}`

      const { error } = await supabase.storage
        .from("products")
        .upload(filePath, new Uint8Array(buffer), {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        })

      if (error) {
        console.error("Storage error:", error)
        return NextResponse.json({ error: "Gagal upload file" }, { status: 500 })
      }

      const publicUrlData = supabase.storage.from("products").getPublicUrl(filePath)

      return NextResponse.json({ success: true, url: publicUrlData.data.publicUrl })
    } catch (err) {
      console.error("Admin client error:", err)
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

