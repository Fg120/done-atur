"use client"

import { useEffect } from "react"

/**
 * Fade loader saat page siap
 */
export function useLoaderFade() {
  useEffect(() => {
    console.log("✨ useLoaderFade effect running!")

    const hideLoader = () => {
      const loader = document.querySelector("[data-loader]") as HTMLElement
      if (loader) {
        loader.style.opacity = "0"
        loader.style.pointerEvents = "none"
        setTimeout(() => {
          loader.style.visibility = "hidden"
          console.log("✅ Loader hidden!")
        }, 500)
      }
    }

    // Start mutation counter
    let mutationCount = 0
    const observer = new MutationObserver(() => {
      mutationCount++
      if (mutationCount % 10 === 0) {
        console.log(`� Mutations: ${mutationCount}`)
      }
      if (mutationCount >= 50) {
        console.log("🎯 50+ mutations - hiding!")
        hideLoader()
        observer.disconnect()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Safety: 4s timeout
    const timeoutId = setTimeout(() => {
      console.log("⏱️ Safety timeout firing!")
      hideLoader()
      observer.disconnect()
    }, 4000)

    // Cleanup
    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, []) // Empty deps - run once on mount
}

