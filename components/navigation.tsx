"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

export function Navigation() {
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "about", "produk", "donasi"]
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">Done-Atur</div>

          <div className="hidden items-center space-x-8 md:flex">
            {[
              { id: "about", label: "About" },
              { id: "produk", label: "Produk" },
              { id: "donasi", label: "Donasi" },
              { id: "kontak", label: "Kontak" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  activeSection === item.id ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button
                variant="outline"
                className="rounded-lg border-primary bg-transparent px-4 py-2 font-medium text-foreground hover:bg-[#ECF8F2]"
              >
                Login
              </Button>
            </Link>
            <Button
              onClick={() => scrollToSection("donasi")}
              className="rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-[#5DBD98]"
            >
              Donasi
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
