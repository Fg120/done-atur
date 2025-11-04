import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentProfile, type Profile } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verify admin access
    const profile = await getCurrentProfile() as Profile | null
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createSupabaseServerClient()

    // Get all approved donations
    const { data: donations, error } = await supabase
      .from("donations")
      .select("id, donor_name, donor_email, donation_type, nominal, net_amount, status")
      .eq("status", "approved")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(donations || [])
  } catch (error) {
    console.error("Error fetching donations list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
