"use client"

import { ReactNode, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    console.log("📍 Route changed to:", pathname)
    
    const loader = document.querySelector("[data-loader]") as HTMLElement
    if (loader) {
      // Instantly show (no animation) + remove transition
      loader.style.transition = "none"
      loader.style.opacity = "1"
      loader.style.visibility = "visible"
      loader.style.pointerEvents = "auto"
    }

    // Fade out after 1s
    const timeoutId = setTimeout(() => {
      const loader = document.querySelector("[data-loader]") as HTMLElement
      if (loader) {
        // Add transition only when fading out
        loader.style.transition = "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
        loader.style.opacity = "0"
        loader.style.pointerEvents = "none"
        setTimeout(() => {
          loader.style.visibility = "hidden"
        }, 500)
      }
    }, 1000) // 1s delay before starting fade out

    return () => clearTimeout(timeoutId)
  }, [pathname]) // Trigger setiap kali pathname berubah!

  return <>{children}</>
}
