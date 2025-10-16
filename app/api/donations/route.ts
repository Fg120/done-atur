import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.donor_email || !body.donation_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate donation type
    if (!["uang", "pakaian"].includes(body.donation_type)) {
      return NextResponse.json(
        { error: "Invalid donation type" },
        { status: 400 }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.donor_email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    // Insert ke database
    try {
      const { getSupabaseAdminClient } = await import("@/lib/supabase/server")
      const supabase = getSupabaseAdminClient() as any

      const { data: donation, error } = await supabase
        .from("donations")
        .insert([
          {
            donor_name: body.donor_name || "Donatur Anonim",
            donor_email: body.donor_email,
            donor_phone: body.donor_phone || null,
            donation_type: body.donation_type,
            nominal: body.nominal || null,
            net_amount: body.net_amount || null,
            payment_method: body.payment_method || null,
            transfer_proof_url: body.transfer_proof_url || null,
            clothing_list: body.clothing_list || null,
            pickup_address: body.pickup_address || null,
            notes: body.notes || null,
            is_anonymous: body.is_anonymous || false,
            status: "pending",
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Database error:", error)
        return NextResponse.json({ error: "Failed to save donation" }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: donation }, { status: 201 })
    } catch (dbError) {
      console.error("Database client error:", dbError)
      return NextResponse.json({ error: "Server error" }, { status: 503 })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
