"use client"

import { useState, useEffect } from "react"
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
    <nav className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">Done-Atur</div>

          <div className="hidden md:flex items-center space-x-8">
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
            <Button
              variant="outline"
              className="border-primary text-foreground hover:bg-[#ECF8F2] bg-transparent font-medium rounded-lg px-4 py-2"
            >
              Login
            </Button>
            <Button
              onClick={() => scrollToSection("donasi")}
              className="bg-primary hover:bg-[#5DBD98] text-primary-foreground font-medium rounded-lg px-5 py-3"
            >
              Donasi
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
