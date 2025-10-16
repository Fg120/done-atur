"use client"

import { Loader2 } from "lucide-react"

export function PageLoader() {
  // Map index to diagonal order (bottom-left to top-right)
  // Grid layout: 0 1 2
  //              3 4 5
  //              6 7 8
  // Diagonal order: 6, 3, 0, 7, 4, 1, 8, 5, 2
  const diagonalOrder = [6, 3, 0, 7, 4, 1, 8, 5, 2]

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 z-[9999]"
      data-loader
    >
      <div className="flex flex-col items-center gap-8">
        {/* Grid 3x3 loader with perfect squares */}
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => {
            const diagonalIndex = diagonalOrder.indexOf(i)
            return (
              <div
                key={i}
                className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-md"
                style={{
                  animation: `diagonalPulse 1.4s ease-in-out infinite`,
                  animationDelay: `${diagonalIndex * 0.12}s`,
                }}
              />
            )
          })}
        </div>
        <p className="text-lg font-medium text-slate-600">Loading...</p>
      </div>
    </div>
  )
}

export function DonationSectionLoader() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      
      {/* Form fields skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
        <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
        <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
      </div>
      
      {/* Button skeleton */}
      <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
    </div>
  )
}

export function AdminTableLoader() {
  return (
    <div className="space-y-4">
      {/* Table header skeleton */}
      <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
      
      {/* Table rows skeleton */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 w-full bg-slate-100 rounded animate-pulse" />
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
