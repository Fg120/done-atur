'use client'

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"

import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { passwordUpdateSchema, type PasswordUpdateInput } from "@/lib/validators"

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [isVerifying, setIsVerifying] = useState(true)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PasswordUpdateInput>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) {
      setTokenError("Token reset tidak ditemukan")
      setIsVerifying(false)
      return
    }

    const params = new URLSearchParams(hash.replace(/^#/, ""))
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")

    if (!accessToken || !refreshToken) {
      setTokenError("Token reset tidak valid")
      setIsVerifying(false)
      return
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setTokenError(error.message)
        } else {
          window.location.hash = ""
        }
      })
      .catch((error) => {
        setTokenError(error instanceof Error ? error.message : "Tidak dapat memproses token")
      })
      .finally(() => setIsVerifying(false))
  }, [supabase])

  const handleSubmit = async (values: PasswordUpdateInput) => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password })

      if (error) {
        toast({
          variant: "destructive",
          title: "Gagal memperbarui password",
          description: error.message,
        })
        return
      }

      toast({
        title: "Password diperbarui",
        description: "Silakan masuk menggunakan password baru Anda.",
      })

      router.push("/auth/login")
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Terjadi kesalahan",
        description: err instanceof Error ? err.message : "Tidak dapat memproses permintaan",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#073B4C] via-[#126782] to-[#1B9AAA]">
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur">
          {isVerifying ? (
            <div className="flex flex-col items-center gap-4 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p>Memverifikasi tautan reset password...</p>
            </div>
          ) : tokenError ? (
            <div className="space-y-4 text-center">
              <h1 className="text-2xl font-semibold text-[#073B4C]">Tautan tidak valid</h1>
              <p className="text-sm text-muted-foreground">{tokenError}</p>
              <Button onClick={() => router.push("/auth/login")} className="w-full bg-[#073B4C] hover:bg-[#0A516A]">
                Kembali ke login
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold text-[#073B4C]">Atur password baru</h1>
                <p className="text-sm text-muted-foreground">Gunakan password kuat yang belum pernah dipakai sebelumnya.</p>
              </div>
              <Form {...form}>
                <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password baru</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Minimal 8 karakter" autoComplete="new-password" disabled={isSubmitting} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Konfirmasi password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Ulangi password" autoComplete="new-password" disabled={isSubmitting} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-[#073B4C] hover:bg-[#0A516A]" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menyimpan...
                      </span>
                    ) : (
                      'Simpan password'
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
      <Footer />
      <Toaster />
    </main>
  )
}
