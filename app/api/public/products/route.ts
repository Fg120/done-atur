import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const condition = searchParams.get("condition")
    const sortBy = searchParams.get("sortBy") || "created_at"
    const order = searchParams.get("order") || "desc"
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 100)

    let query = supabase
      .from("products")
      .select("id, title, description, category, condition, price, photo_urls, user_id, status, created_at", {
        count: "exact",
      })
      .eq("status", "active")

    // Filter by category
    if (category && category !== "semua") {
      query = query.eq("category", category)
    }

    // Filter by condition
    if (condition && condition !== "semua") {
      query = query.eq("condition", condition)
    }

    // Sort
    if (sortBy === "harga-rendah") {
      query = query.order("price", { ascending: true })
    } else if (sortBy === "harga-tinggi") {
      query = query.order("price", { ascending: false })
    } else {
      query = query.order("created_at", { ascending: order === "asc" })
    }

    query = query.limit(limit)

    const { data: products, error } = await query

    if (error) {
      console.error("Products fetch error:", error)
      return NextResponse.json(
        { error: "Gagal mengambil data produk" },
        { status: 500 }
      )
    }

    // Get seller names from profiles
    const userIds = [...new Set(products?.map((p: any) => p.user_id) || [])]
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds)

    const profileMap = new Map(profiles?.map((p: any) => [p.id, p.full_name]) || [])

    // Transform products with seller info
    const transformedProducts = products?.map((p: any) => ({
      id: p.id,
      name: p.title,
      description: p.description,
      category: p.category,
      condition: p.condition === "baru" ? "Baru" : "Preloved",
      price: p.price,
      image: p.photo_urls?.[0] || "/placeholder.svg",
      seller: profileMap.get(p.user_id) || "Penjual",
    }))

    return NextResponse.json(transformedProducts || [], {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    })
  } catch (error) {
    console.error("Products API error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
