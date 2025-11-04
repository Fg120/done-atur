import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentProfile, type Profile } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const profile = await getCurrentProfile() as Profile | null
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createSupabaseServerClient()

    // Get all donations
    const { data: donations, error: donationsError } = await supabase
      .from("donations")
      .select("id, donation_type, nominal, net_amount, status, donor_email")

    if (donationsError) throw donationsError

    // Get all accountability records to identify verified donations
    const { data: accountabilities, error: accountError } = await supabase
      .from("accountability")
      .select("donation_ids")

    if (accountError) throw accountError

    // Flatten all verified donation IDs (dari accountability)
    const verifiedDonationIds = new Set<string>()
    accountabilities?.forEach((record: any) => {
      if (record.donation_ids && Array.isArray(record.donation_ids)) {
        record.donation_ids.forEach((id: string) => verifiedDonationIds.add(id))
      }
    })

    // Donasi dengan status "pending" (menunggu persetujuan)
    const pendingStatusDonations = donations?.filter((d: any) => d.status === "pending") || []

    // Donasi approved yang masuk di pertanggungjawaban (verified)
    const verifiedDonations = donations?.filter((d: any) => d.status === "approved" && verifiedDonationIds.has(d.id)) || []

    // Donasi rejected
    const rejectedDonations = donations?.filter((d: any) => d.status === "rejected") || []

    // Calculate statistics
    const stats = {
      totalDonations: donations?.length || 0,
      totalDonors: new Set(donations?.map((d: any) => d.donor_email).filter(Boolean)).size || 0,
      pendingAmount: pendingStatusDonations.reduce((sum: number, d: any) => sum + (d.net_amount || 0), 0) || 0,
      verifiedAmount: verifiedDonations.reduce((sum: number, d: any) => sum + (d.net_amount || 0), 0) || 0,
      rejectedAmount: rejectedDonations.reduce((sum: number, d: any) => sum + (d.net_amount || 0), 0) || 0,
      pendingDonations: pendingStatusDonations.length || 0,
      approvedDonations: donations?.filter((d: any) => d.status === "approved").length || 0,
      rejectedDonations: rejectedDonations.length || 0,
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
