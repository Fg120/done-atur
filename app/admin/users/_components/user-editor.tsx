'use client'

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Loader2, Trash2 } from "lucide-react"
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
import { adminUpdateUserSchema, type AdminUpdateUserInput } from "@/lib/validators"

interface UserDetail {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string | null
  updated_at: string | null
}

interface AdminUserEditorProps {
  user: UserDetail
  isSelf: boolean
}

const DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function AdminUserEditor({ user, isSelf }: AdminUserEditorProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<AdminUpdateUserInput>({
    resolver: zodResolver(adminUpdateUserSchema),
    defaultValues: {
      full_name: user.full_name ?? "",
      role: user.role,
    },
  })

  const metadata = useMemo(() => {
    return {
      created: user.created_at ? DATE_FORMATTER.format(new Date(user.created_at)) : '�',
      updated: user.updated_at ? DATE_FORMATTER.format(new Date(user.updated_at)) : '�',
    }
  }, [user.created_at, user.updated_at])

  const handleSubmit = async (values: AdminUpdateUserInput) => {
    const payload: AdminUpdateUserInput = {}
    if (values.full_name && values.full_name.trim() !== (user.full_name ?? '')) {
      payload.full_name = values.full_name.trim()
    }
    if (values.role && values.role !== user.role) {
      payload.role = values.role
    }

    if (Object.keys(payload).length === 0) {
      toast({
        title: 'Tidak ada perubahan',
        description: 'Perbarui data terlebih dahulu sebelum menyimpan.',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 422 && result?.details) {
          form.setError('full_name', { message: result.details.full_name?.[0] })
          form.setError('role', { message: result.details.role?.[0] })
        }
        throw new Error(result?.error ?? 'Gagal memperbarui pengguna')
      }

      toast({
        title: 'Perubahan disimpan',
        description: 'Data pengguna berhasil diperbarui.',
      })
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Terjadi kesalahan',
        description: error instanceof Error ? error.message : 'Tidak dapat memperbarui pengguna',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error ?? 'Gagal menghapus pengguna')
      }

      toast({
        title: 'Pengguna dihapus',
        description: 'Akun dan data terkait telah dihapus.',
      })
      router.push('/admin/users')
      router.refresh()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Terjadi kesalahan',
        description: error instanceof Error ? error.message : 'Tidak dapat menghapus pengguna',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr,0.8fr]">
      <div className="rounded-3xl border border-[#E4E2F5] bg-white/95 p-8 shadow-xl backdrop-blur">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold text-[#312E81]">Profil pengguna</h2>
          <p className="text-sm text-muted-foreground">
            Perbarui nama dan peran untuk mengatur akses fitur Done-Atur.
          </p>
        </div>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama pengguna" disabled={isSaving || isDeleting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Email</FormLabel>
              <p className="mt-1 text-base font-medium text-[#312E81]">{user.email}</p>
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peran</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSaving || isDeleting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih peran" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
          <h3 className="text-lg font-semibold text-[#312E81]">Aktivitas akun</h3>
          <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <dt>Dibuat</dt>
              <dd className="font-medium text-[#312E81]">{metadata.created}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Pembaruan terakhir</dt>
              <dd className="font-medium text-[#312E81]">{metadata.updated}</dd>
            </div>
          </dl>
          {isSelf ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#FEF3C7] p-4 text-sm text-[#92400E]">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>Anda sedang melihat akun sendiri. Berhati-hatilah saat mengubah peran atau menghapus akun.</p>
            </div>
          ) : null}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="justify-center gap-2 border-[#DC2626] text-[#DC2626] hover:bg-[#FEE2E2]"
              disabled={isSaving || isDeleting}
            >
              {isDeleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </span>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Hapus pengguna
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus pengguna ini?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan menghapus akun {user.email} dan seluruh data profil terkait. Operasi tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                className="bg-[#DC2626] hover:bg-[#B91C1C]"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                Konfirmasi hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
