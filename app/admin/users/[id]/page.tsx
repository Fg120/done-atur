import { notFound } from "next/navigation"

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  notFound()
}

        <AdminUserEditor user={data} isSelf={currentProfile?.id === data.id} />
      </div>
      <Toaster />
    </div>
  )
}