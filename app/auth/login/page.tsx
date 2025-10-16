'use client'

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { loginSchema, type LoginInput } from "@/lib/validators"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const redirectTarget = (() => {
    const redirect = searchParams.get("redirect")
    if (!redirect) return "/account"
    return redirect.startsWith("/") ? redirect : "/account"
  })()

  const handleSubmit = async (values: LoginInput) => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword(values)

      if (error) {
        toast({
          variant: "destructive",
          title: "Login gagal",
          description: error.message,
        })
        return
      }

      toast({
        title: "Berhasil masuk",
        description: "Selamat datang kembali di Done-Atur.",
      })

      router.push(redirectTarget)
      router.refresh()
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
            Atur donasi dan penjualanmu dengan lebih mudah
          </h1>
          <div className="bg-[rgba(255,255,255,0.12)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.25)] rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.35)] p-8 text-white">
            <div className="mb-6 space-y-2 text-center">
              <h2 className="text-xl font-medium text-white">Masuk ke akunmu</h2>
              <p className="text-sm text-white/70">Gunakan email dan password yang sudah terdaftar.</p>
            </div>

            <Form {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
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
                            placeholder="********"
                            autoComplete="current-password"
                            disabled={isSubmitting}
                            className="rounded-full h-12 px-4 pr-12 bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.25)] text-white placeholder:text-white/60 focus:border-[#93C5FD] focus:ring-[rgba(147,197,253,0.35)] focus:ring-2"
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

                <div className="flex items-center justify-end text-sm">
                  <Link href="/auth/register" className="font-medium text-white hover:underline">
                    Belum punya akun?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-full bg-white text-gray-800 hover:bg-gray-200 transition duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    "Masuk sekarang"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </section>
      <Toaster />
    </main>
  )
}
