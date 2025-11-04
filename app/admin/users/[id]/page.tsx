import { notFound } from "next/navigation"

import { AdminUserEditor } from "@/app/admin/users/_components/user-editor"
import { getProfileById } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"

interface PageProps {
  params: { id: string }
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const profile = (await getProfileById(params.id)) as any
  if (!profile) {
    notFound()
  }

  const supabase = createSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const isSelf = authUser?.id === profile.id

  return (
    <div className="container mx-auto">
      <AdminUserEditor
        user={{
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }}
        isSelf={!!isSelf}
      />
    </div>
  )
}
