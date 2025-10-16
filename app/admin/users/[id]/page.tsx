import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { AdminUserEditor } from "@/app/admin/users/_components/user-editor"
import { Toaster } from "@/components/ui/toaster"
import { getCurrentProfile } from "@/lib/auth"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { userIdParamSchema } from "@/lib/validators"

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const parsed = userIdParamSchema.safeParse(params)
  if (!parsed.success) {
    notFound()
  }

  const currentProfile = await getCurrentProfile()
  const supabaseAdmin = getSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, role, created_at, updated_at")
    .eq("id", parsed.data.id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      notFound()
    }
    throw error
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <Link
          href="/admin/users"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke daftar pengguna
        </Link>
        <div className="space-y-4">
          <span className="inline-flex w-fit items-center rounded-full bg-blue-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-800">
            {data.role}
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-gray-900">{data.full_name ?? "Tanpa nama"}</h1>
            <p className="text-lg text-gray-600">{data.email}</p>
          </div>
        </div>

        <AdminUserEditor user={data} isSelf={currentProfile?.id === data.id} />
      </div>
      <Toaster />
    </div>
  )
}