import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Fetch approved donations only for public statistics
    const { data: donations, error: donationsError } = await supabase
      .from("donations")
      .select("id, donation_type, nominal, net_amount, status, donor_email")
      .eq("status", "approved")

    if (donationsError) {
      console.error("Donations fetch error:", donationsError)
      return NextResponse.json(
        { error: "Gagal mengambil data donasi" },
        { status: 500 }
      )
    }

    // Calculate statistics from approved donations
    const stats = {
      totalAmount: donations?.reduce((sum: number, d: any) => sum + (d.net_amount || 0), 0) || 0,
      clothesDonations: donations?.filter((d: any) => d.donation_type === "pakaian").length || 0,
      totalDonors: new Set(donations?.map((d: any) => d.donor_email).filter(Boolean)).size || 0,
    }

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    })
  } catch (error) {
    console.error("Stats API error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
