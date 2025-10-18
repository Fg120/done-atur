"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Gift, TrendingUp, Calendar } from "lucide-react"

interface DashboardStats {
  totalDonations: number
  totalDonors: number
  totalAmount: number
  pendingDonations: number
  moneyDonations: number
  clothesDonations: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDonations: 0,
    totalDonors: 0,
    totalAmount: 0,
    pendingDonations: 0,
    moneyDonations: 0,
    clothesDonations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const StatCard = ({ icon: Icon, label, value, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Selamat datang di panel administrasi. Berikut adalah ringkasan data Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Gift}
          label="Total Donasi"
          value={stats.totalDonations}
          description="Jumlah donasi yang masuk"
        />
        <StatCard
          icon={Users}
          label="Total Donor"
          value={stats.totalDonors}
          description="Jumlah donor yang terdaftar"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Nominal"
          value={`Rp ${(stats.totalAmount || 0).toLocaleString("id-ID")}`}
          description="Total uang yang diterima"
        />
        <StatCard
          icon={Calendar}
          label="Donasi Pending"
          value={stats.pendingDonations}
          description="Menunggu konfirmasi"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jenis Donasi</CardTitle>
            <CardDescription>Breakdown berdasarkan tipe donasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-blue-50">💵</Badge>
                <span>Donasi Uang</span>
              </div>
              <span className="font-semibold">{stats.moneyDonations}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50">👕</Badge>
                <span>Donasi Pakaian</span>
              </div>
              <span className="font-semibold">{stats.clothesDonations}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Donasi</CardTitle>
            <CardDescription>Quick access ke halaman manajemen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/donations"
              className="block p-2 rounded hover:bg-accent transition-colors"
            >
              📋 Kelola Donasi
            </a>
            <a
              href="/admin/users"
              className="block p-2 rounded hover:bg-accent transition-colors"
            >
              👥 Kelola Pengguna
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
