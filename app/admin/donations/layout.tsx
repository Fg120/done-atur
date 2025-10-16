import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Manajemen Donasi",
  description: "Kelola dan pantau semua donasi yang masuk",
}

export default function DonationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
