"use client"

import { useEffect } from "react"

export function HideLoaderScript() {
  useEffect(() => {
    console.log("🚀 HideLoaderScript mounted!")
    
    // Simple: just hide after 3 seconds
    const timeoutId = setTimeout(() => {
      const loader = document.querySelector("[data-loader]") as HTMLElement
      if (loader) {
        loader.style.opacity = "0"
        loader.style.visibility = "hidden"
        console.log("✅ Loader hidden by HideLoaderScript!")
      }
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [])

  return null
}
