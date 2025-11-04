import { notFound } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ProductEditor } from "@/app/admin/products/_components/product-editor"

interface PageProps { params: { id: string } }

export default async function AdminProductDetailPage({ params }: PageProps) {
  const supabase = createSupabaseServerClient()
  const { data: product, error } = await (supabase as any)
    .from("products")
    .select("id, user_id, title, condition, price, stock, status, photo_urls, created_at, updated_at")
    .eq("id", params.id)
    .single()

  if (error || !product) {
    notFound()
  }

  return (
    <div className="container mx-auto">
      <ProductEditor product={product} />
    </div>
  )
}

