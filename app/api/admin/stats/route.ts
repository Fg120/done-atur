import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentProfile, type Profile } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const profile = await getCurrentProfile() as Profile | null
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createSupabaseServerClient()

    // Get donations stats
    const { data: donations, error: donationsError } = await supabase
      .from("donations")
      .select("id, donation_type, nominal, net_amount, status, donor_id")

    if (donationsError) throw donationsError

    // Calculate statistics
    const stats = {
      totalDonations: donations?.length || 0,
      totalDonors: new Set(donations?.map((d: any) => d.donor_id)).size || 0,
      totalAmount: donations?.reduce((sum: number, d: any) => sum + (d.net_amount || 0), 0) || 0,
      pendingDonations: donations?.filter((d: any) => d.status === "pending").length || 0,
      moneyDonations: donations?.filter((d: any) => d.donation_type === "uang").length || 0,
      clothesDonations: donations?.filter((d: any) => d.donation_type === "pakaian").length || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
