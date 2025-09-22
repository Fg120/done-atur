"use client"

import { Button } from "@/components/ui/button"

export function HeroSection() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section id="hero" className="min-h-[85vh] flex items-center bg-gradient-to-br from-white to-[#ECF8F2]/30">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
              Atur Kebaikanmu. Donasikan atau Belanja Pakaian Berfaedah.
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed text-pretty">
              Platform transparan yang menghubungkan donasi dan penjualan pakaian untuk menciptakan dampak sosial yang
              berkelanjutan.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => scrollToSection("donasi")}
                className="bg-primary hover:bg-[#5DBD98] text-primary-foreground font-medium rounded-lg px-8 py-4 text-lg"
              >
                Donasi Sekarang
              </Button>
              <Button
                onClick={() => scrollToSection("produk")}
                variant="outline"
                className="border-primary text-foreground hover:bg-[#ECF8F2] font-medium rounded-lg px-8 py-4 text-lg"
              >
                Belanja Pakaian
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-[#ECF8F2] to-primary/20 flex items-center justify-center">
              <img
                src="/clothing-rack-with-organized-clothes-donation-illu.jpg"
                alt="Rak pakaian terorganisir untuk donasi"
                className="w-80 h-80 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
