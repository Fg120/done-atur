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

    // Get all accountability records to identify distributed donations
    const { data: accountabilities, error: accountError } = await supabase
      .from("accountability")
      .select("donation_ids")

    if (accountError) throw accountError

    // Flatten all distributed donation IDs (dari accountability)
    const distributedDonationIds = new Set<string>()
    accountabilities?.forEach((record: any) => {
      if (record.donation_ids && Array.isArray(record.donation_ids)) {
        record.donation_ids.forEach((id: string) => distributedDonationIds.add(id))
      }
    })

    // Donasi dengan status "pending" (menunggu persetujuan)
    const pendingStatusDonations = donations?.filter((d: any) => d.status === "pending") || []

    // Donasi dengan status "approved" (sudah disetujui/terverifikasi)
    const approvedDonations = donations?.filter((d: any) => d.status === "approved") || []

    // Donasi approved yang masuk di accountability (sudah disalurkan)
    const distributedDonations = donations?.filter((d: any) => d.status === "approved" && distributedDonationIds.has(d.id)) || []

    // Donasi rejected
    const rejectedDonations = donations?.filter((d: any) => d.status === "rejected") || []

    // Pisahkan money dan clothing donations untuk setiap status
    const moneyDonations = donations?.filter((d: any) => d.donation_type === "uang") || []
    const clothingDonations = donations?.filter((d: any) => d.donation_type === "pakaian") || []

    // Money donations breakdown
    const moneyPending = moneyDonations.filter((d: any) => d.status === "pending") || []
    const moneyApproved = moneyDonations.filter((d: any) => d.status === "approved") || []
    const moneyDistributed = moneyDonations.filter((d: any) => d.status === "approved" && distributedDonationIds.has(d.id)) || []
    const moneyRejected = moneyDonations.filter((d: any) => d.status === "rejected") || []

    // Clothing donations breakdown
    const clothingPending = clothingDonations.filter((d: any) => d.status === "pending") || []
    const clothingApproved = clothingDonations.filter((d: any) => d.status === "approved") || []
    const clothingDistributed = clothingDonations.filter((d: any) => d.status === "approved" && distributedDonationIds.has(d.id)) || []
    const clothingRejected = clothingDonations.filter((d: any) => d.status === "rejected") || []

    // Calculate statistics
    const stats = {
      // Overall totals
      totalDonations: donations?.length || 0,
      totalDonors: new Set(donations?.map((d: any) => d.donor_email).filter(Boolean)).size || 0,
      
      // Money donations (Uang)
      pendingAmount: moneyPending.reduce((sum: number, d: any) => sum + (d.net_amount || 0), 0) || 0,
      verifiedAmount: moneyApproved.reduce((sum: number, d: any) => sum + (d.net_amount || 0), 0) || 0,
      distributedAmount: moneyDistributed.reduce((sum: number, d: any) => sum + (d.net_amount || 0), 0) || 0,
      rejectedAmount: moneyRejected.reduce((sum: number, d: any) => sum + (d.net_amount || 0), 0) || 0,
      
      // Money donation counts
      pendingDonations: moneyPending.length || 0,
      approvedDonations: moneyApproved.length || 0,
      distributedDonations: moneyDistributed.length || 0,
      rejectedDonations: moneyRejected.length || 0,
      
      // Type counts
      moneyDonationsCount: moneyDonations.length || 0,
      clothesDonationsCount: clothingDonations.length || 0,
      
      // Clothing donations statistics (4 tiers like money)
      clothingPending: clothingPending.length || 0,
      clothingVerified: clothingApproved.length || 0,
      clothingDistributed: clothingDistributed.length || 0,
      clothingRejected: clothingRejected.length || 0,
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
