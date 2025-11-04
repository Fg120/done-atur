import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentProfile, type Profile } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { adminCreateAccountabilitySchema } from "@/lib/validators"

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const profile = await getCurrentProfile() as Profile | null
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validated = adminCreateAccountabilitySchema.parse(body)

    const supabase = createSupabaseServerClient()

    // Insert accountability
    const { data, error } = await (supabase
      .from("accountability")
      .insert({
        location: validated.location,
        activity_date: validated.activity_date,
        description: validated.description,
        donation_ids: validated.donation_ids,
        photo_urls: validated.photo_urls || [],
        created_by: profile.id,
      }) as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating accountability:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from("accountability")
      .select("id, location, activity_date, description, donation_ids, created_by, created_at, updated_at")
      .order("activity_date", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching accountability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const profile = await getCurrentProfile() as Profile | null
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID diperlukan" }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    const { error } = await supabase
      .from("accountability")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting accountability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
