import { redirect } from "next/navigation"

import { ProfileForm } from "@/app/account/_components/profile-form"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { getCurrentProfile } from "@/lib/auth"

export default async function AccountPage() {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#ECF8F2] via-white to-[#F1FAEE]">
      <section className="py-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
          <header className="space-y-6">
            <span className="inline-flex w-fit items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm">
              Halo, {profile.full_name ?? profile.email}
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-[#073B4C] md:text-5xl">
                Kelola identitas dan keamanan akunmu
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Perbarui informasi dasar, cek status peran, dan pastikan akun Done-Atur selalu siap untuk mengelola donasi dan penjualan.
              </p>
            </div>
          </header>

          <ProfileForm profile={profile} />
        </div>
      </section>
      <Footer />
      <Toaster />
    </main>
  )
}
