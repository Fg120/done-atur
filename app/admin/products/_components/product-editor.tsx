'use client'

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Loader2, Trash2, Upload } from "lucide-react"
import { useForm } from "react-hook-form"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { adminUpdateProductSchema, type AdminUpdateProductInput } from "@/lib/validators"

interface ProductDetail {
  id: string
  user_id: string
  title: string
  condition: 'baru' | 'bekas'
  price: number
  stock: number
  status: 'active' | 'inactive'
  photo_urls: string[] | null
  created_at: string | null
  updated_at: string | null
}

interface ProductEditorProps { product: ProductDetail }

const DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function ProductEditor({ product }: ProductEditorProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const form = useForm<AdminUpdateProductInput>({
    resolver: zodResolver(adminUpdateProductSchema),
    defaultValues: {
      title: product.title,
      condition: product.condition,
      price: product.price,
      stock: product.stock,
      status: product.status,
      photo_urls: product.photo_urls ?? [],
    },
  })

  const metadata = useMemo(() => {
    return {
      created: product.created_at ? DATE_FORMATTER.format(new Date(product.created_at)) : '-'
    }
  }, [product.created_at])

  const handleSubmit = async (values: AdminUpdateProductInput) => {
    const payload: AdminUpdateProductInput = {}
    if (typeof values.title !== 'undefined' && values.title.trim() !== product.title) payload.title = values.title.trim()
    if (typeof values.condition !== 'undefined' && values.condition !== product.condition) payload.condition = values.condition
    if (typeof values.price !== 'undefined' && values.price !== product.price) payload.price = values.price
    if (typeof values.stock !== 'undefined' && values.stock !== product.stock) payload.stock = values.stock
    if (typeof values.status !== 'undefined' && values.status !== product.status) payload.status = values.status
    if (typeof values.photo_urls !== 'undefined') payload.photo_urls = values.photo_urls

    if (Object.keys(payload).length === 0) {
      toast({ title: 'Tidak ada perubahan', description: 'Perbarui data terlebih dahulu sebelum menyimpan.' })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        if (response.status === 422 && result?.details) {
          form.setError('title', { message: result.details.title?.[0] })
          form.setError('condition', { message: result.details.condition?.[0] })
          form.setError('price', { message: result.details.price?.[0] })
          form.setError('stock', { message: result.details.stock?.[0] })
          form.setError('status', { message: result.details.status?.[0] })
        }
        throw new Error(result?.error ?? 'Gagal memperbarui produk')
      }
      toast({ title: 'Perubahan disimpan', description: 'Data produk berhasil diperbarui.' })
      router.refresh()
    } catch (error) {
      toast({ variant: 'destructive', title: 'Terjadi kesalahan', description: error instanceof Error ? error.message : 'Tidak dapat memperbarui produk' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? 'Gagal menghapus produk')
      toast({ title: 'Produk dihapus' })
      window.location.href = '/admin/products'
    } catch (error) {
      toast({ variant: 'destructive', title: 'Terjadi kesalahan', description: error instanceof Error ? error.message : 'Tidak dapat menghapus produk' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('productId', product.id)
      const response = await fetch('/api/products/upload', { method: 'POST', body: formData })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error ?? 'Gagal upload foto')
      const url: string = result?.url
      if (url) {
        const current = form.getValues('photo_urls') ?? []
        form.setValue('photo_urls', [...current, url])
        toast({ title: 'Foto diunggah' })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload gagal', description: error instanceof Error ? error.message : 'Tidak dapat upload foto' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="rounded-3xl border border-[#E4E2F5] bg-white/85 p-8 shadow-xl backdrop-blur lg:col-span-2">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold text-[#312E81]">Detail produk</h2>
          <p className="text-sm text-muted-foreground">Perbarui atribut produk dan kelola foto.</p>
        </div>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl>
                    <Input placeholder="Judul produk" disabled={isSaving || isDeleting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kondisi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSaving || isDeleting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kondisi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baru">Baru</SelectItem>
                        <SelectItem value="bekas">Bekas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSaving || isDeleting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" disabled={isSaving || isDeleting} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stok</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" disabled={isSaving || isDeleting} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Foto</FormLabel>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file)
                  }}
                  disabled={uploading || isSaving || isDeleting}
                />
                <Button type="button" variant="outline" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                {(form.watch('photo_urls') ?? []).map((url, idx) => (
                  <div key={url + idx} className="relative overflow-hidden rounded border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Product photo" className="h-32 w-full object-cover" />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="absolute right-2 top-2 bg-white/80"
                      onClick={() => {
                        const next = (form.getValues('photo_urls') ?? []).filter((u) => u !== url)
                        form.setValue('photo_urls', next)
                      }}
                    >
                      Hapus
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="bg-[#312E81] hover:bg-[#4338CA]" disabled={isSaving || isDeleting}>
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                'Simpan perubahan'
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-[#E4E2F5] bg-white/85 p-8 shadow-xl backdrop-blur">
          <h3 className="text-lg font-semibold text-[#312E81]">Aktivitas</h3>
          <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <dt>Dibuat</dt>
              <dd className="font-medium text-[#312E81]">{metadata.created}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#FEF3C7] p-4 text-sm text-[#92400E]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>Hati-hati saat mengubah status atau menghapus produk.</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="justify-center gap-2 border-[#DC2626] text-[#DC2626] hover:bg-[#FEE2E2]" disabled={isSaving || isDeleting}>
              {isDeleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </span>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Hapus produk
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus produk ini?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan menghapus produk beserta foto terkait. Operasi tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction className="bg-[#DC2626] hover:bg-[#B91C1C]" onClick={handleDelete} disabled={isDeleting}>
                Konfirmasi hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

