"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Heart, Users, Recycle } from "lucide-react"

interface Stats {
  totalAmount: number
  clothesDonations: number
  totalDonors: number
}

export function AboutSection() {
  const [stats, setStats] = useState<Stats>({
    totalAmount: 0,
    clothesDonations: 0,
    totalDonors: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/public/stats")
        if (response.ok) {
          const data = await response.json()
          setStats({
            totalAmount: data.totalAmount || 0,
            clothesDonations: data.clothesDonations || 0,
            totalDonors: data.totalDonors || 0,
          })
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const values = [
    {
      icon: Heart,
      title: "Transparansi",
      description: "Setiap donasi dan transaksi dapat dilacak dengan jelas untuk memastikan akuntabilitas penuh.",
    },
    {
      icon: Users,
      title: "Dampak Sosial",
      description: "Menciptakan perubahan nyata melalui distribusi pakaian dan bantuan kepada yang membutuhkan.",
    },
    {
      icon: Recycle,
      title: "Sirkularitas Pakaian",
      description: "Mendorong ekonomi sirkular dengan memberikan kehidupan kedua pada pakaian berkualitas.",
    },
  ]

  return (
    <section id="about" className="py-20 bg-secondary/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">Tentang Done-Atur</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Kami berkomitmen menciptakan ekosistem donasi dan penjualan pakaian yang transparan, berkelanjutan, dan
            berdampak positif bagi masyarakat.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {values.map((value, index) => (
            <Card
              key={index}
              className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow p-8 text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <value.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-4">{value.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{value.description}</p>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="text-3xl font-bold text-primary mb-2">
              Rp {isLoading ? "..." : (stats.totalAmount || 0).toLocaleString("id-ID")}
            </div>
            <div className="text-muted-foreground">Donasi tersalurkan</div>
          </div>
          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="text-3xl font-bold text-primary mb-2">
              {isLoading ? "..." : stats.clothesDonations || 0}+
            </div>
            <div className="text-muted-foreground">Pakaian tersalurkan</div>
          </div>
          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="text-3xl font-bold text-primary mb-2">
              {isLoading ? "..." : stats.totalDonors || 0}+
            </div>
            <div className="text-muted-foreground">Penerima Donasi</div>
          </div>
        </div>
      </div>
    </section>
  )
}
