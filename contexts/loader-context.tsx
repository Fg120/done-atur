"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface LoaderContextType {
  isVisible: boolean
  hideLoader: () => void
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined)

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true)

  const hideLoader = () => {
    setIsVisible(false)
  }

  return (
    <LoaderContext.Provider value={{ isVisible, hideLoader }}>
      {children}
    </LoaderContext.Provider>
  )
}

export function useLoader() {
  const context = useContext(LoaderContext)
  if (!context) {
    throw new Error("useLoader must be used within LoaderProvider")
  }
  return context
}
