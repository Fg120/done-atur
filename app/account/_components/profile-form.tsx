'use client'

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, LogOut } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validators"
import type { Profile } from "@/lib/auth"

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
    },
  })

  const handleSubmit = async (values: ProfileUpdateInput) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: values.full_name.trim() })
        .eq("id", profile.id)
        .select("id")
        .single()

      if (error) {
        toast({
          variant: "destructive",
          title: "Gagal menyimpan profil",
          description: error.message,
        })
        return
      }

      toast({
        title: "Profil diperbarui",
        description: "Perubahan nama berhasil disimpan.",
      })
      router.refresh()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Terjadi kesalahan",
        description: err instanceof Error ? err.message : "Tidak dapat memproses permintaan",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast({
          variant: "destructive",
          title: "Gagal keluar",
          description: error.message,
        })
        return
      }

      router.push("/")
      router.refresh()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Terjadi kesalahan",
        description: err instanceof Error ? err.message : "Tidak dapat memproses permintaan",
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr,0.65fr]">
      <div className="rounded-3xl border border-white/70 bg-white/95 p-8 shadow-lg backdrop-blur">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold text-[#073B4C]">Profil pribadi</h2>
          <p className="text-sm text-muted-foreground">
            Perbarui identitas yang akan tampil di dashboard dan laporan donasi.
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
                    <Input placeholder="Nama Anda" autoComplete="name" disabled={isSaving || isSigningOut} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1 text-base font-medium text-[#073B4C]">{profile.email}</p>
            </div>

            <Button type="submit" className="bg-[#073B4C] hover:bg-[#0A516A]" disabled={isSaving || isSigningOut}>
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                "Simpan perubahan"
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="flex flex-col justify-between gap-6 rounded-3xl border border-white/70 bg-white/80 p-8 shadow-lg backdrop-blur">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#073B4C]">Status akun</h3>
          <div className="rounded-2xl bg-[#ECF8F2] p-4">
            <p className="text-sm text-muted-foreground">Peran</p>
            <p className="text-lg font-semibold text-[#0A516A]">{profile?.role?.toUpperCase()}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Peran menentukan akses ke fitur admin dan pengelolaan pengguna. Hubungi admin utama jika membutuhkan perubahan peran.
          </p>
        </div>
        <Button
          variant="outline"
          className="justify-center gap-2 border-[#073B4C] text-[#073B4C] hover:bg-[#ECF8F2]"
          onClick={handleSignOut}
          disabled={isSaving || isSigningOut}
        >
          {isSigningOut ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Keluar...
            </span>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Keluar dari akun
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
