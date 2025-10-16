'use client'

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { registerSchema, type RegisterInput } from "@/lib/validators"

export default function RegisterPage() {
  const router = useRouter()
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const handleSubmit = async (values: RegisterInput) => {
    setIsSubmitting(true)
    try {
      const { full_name, email, password } = values
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== "undefined" ? window.location.origin : "")

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name },
          emailRedirectTo: `${baseUrl}/auth/login`,
        },
      })

      if (error) {
        toast({
          variant: "destructive",
          title: "Registrasi gagal",
          description: error.message,
        })
        return
      }

      if (data.user?.id) {
        await supabase.from("t_profiles").update({ name }).eq("id", data.user.id)
      }

      if (data.session) {
        toast({
          title: "Akun siap digunakan",
          description: "Anda telah masuk otomatis.",
        })
        router.push("/account")
        router.refresh()
        return
      }

      toast({
        title: "Verifikasi email dikirim",
        description: "Silakan cek inbox Anda untuk mengaktifkan akun.",
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
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#0EA5E9] to-[#3B82F6]">
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
            Gabung dan bantu kelola donasi yang berdampak
          </h1>
          <div className="bg-[rgba(255,255,255,0.12)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.25)] rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.35)] p-8 text-white">
            <div className="mb-6 space-y-2 text-center">
              <h2 className="text-xl font-medium text-white">Buat akun Done-Atur</h2>
              <p className="text-sm text-white/70">Isi data di bawah untuk memulai kontribusimu.</p>
            </div>

            <Form {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Nama lengkap</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jane Doe"
                          autoComplete="name"
                          disabled={isSubmitting}
                          className="rounded-full h-12 px-4 bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.25)] text-white placeholder:text-white/60 focus:border-[#93C5FD] focus:ring-[rgba(147,197,253,0.35)] focus:ring-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="nama@contoh.com"
                          autoComplete="email"
                          disabled={isSubmitting}
                          className="rounded-full h-12 px-4 bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.25)] text-white placeholder:text-white/60 focus:border-[#93C5FD] focus:ring-[rgba(147,197,253,0.35)] focus:ring-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Minimal 8 karakter"
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            className="rounded-full h-12 px-4 bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.25)] text-white placeholder:text-white/60 focus:border-[#93C5FD] focus:ring-[rgba(147,197,253,0.35)] focus:ring-2"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
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
                      <FormLabel className="text-white">Konfirmasi password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Ulangi password"
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            className="rounded-full h-12 px-4 pr-12 bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.25)] text-white placeholder:text-white/60 focus:border-[#93C5FD] focus:ring-[rgba(147,197,253,0.35)] focus:ring-2"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 rounded-full bg-white text-gray-800 hover:bg-gray-200 transition duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mendaftarkan...
                    </span>
                  ) : (
                    "Daftar sekarang"
                  )}
                </Button>

                <p className="text-center text-sm text-white/80">
                  Sudah punya akun?{" "}
                  <Link href="/auth/login" className="font-medium text-white hover:underline">
                    Masuk di sini
                  </Link>
                </p>
              </form>
            </Form>
          </div>
        </div>
      </section>
      <Toaster />
    </main>
  )
}