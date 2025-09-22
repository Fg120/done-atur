"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User } from "lucide-react"

export function ProductSection() {
  const [selectedCategory, setSelectedCategory] = useState("semua")
  const [selectedCondition, setSelectedCondition] = useState("semua")
  const [sortBy, setSortBy] = useState("terbaru")

  const products = [
    {
      id: 1,
      name: "Kemeja Formal Pria",
      condition: "Baru",
      price: 150000,
      category: "pria",
      image: "/formal-mens-shirt.jpg",
      seller: "Ahmad Rizki", // Added seller name
    },
    {
      id: 2,
      name: "Dress Casual Wanita",
      condition: "Preloved",
      price: 85000,
      category: "wanita",
      image: "/casual-womens-dress.jpg",
      seller: "Sari Dewi", // Added seller name
    },
    {
      id: 3,
      name: "Kaos Anak Lucu",
      condition: "Baru",
      price: 45000,
      category: "anak",
      image: "/cute-kids-t-shirt.jpg",
      seller: "Budi Santoso", // Added seller name
    },
    {
      id: 4,
      name: "Jaket Denim Pria",
      condition: "Preloved",
      price: 120000,
      category: "pria",
      image: "/mens-denim-jacket.jpg",
      seller: "Donatur Anonim", // Added seller name
    },
    {
      id: 5,
      name: "Blouse Kerja Wanita",
      condition: "Baru",
      price: 95000,
      category: "wanita",
      image: "/womens-work-blouse.jpg",
      seller: "Maya Indira", // Added seller name
    },
    {
      id: 6,
      name: "Celana Jeans Anak",
      condition: "Preloved",
      price: 55000,
      category: "anak",
      image: "/kids-jeans-pants.jpg",
      seller: "Toko Berkah", // Added seller name
    },
  ]

  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCategory === "semua" || product.category === selectedCategory
    const conditionMatch = selectedCondition === "semua" || product.condition.toLowerCase() === selectedCondition
    return categoryMatch && conditionMatch
  })

  return (
    <section id="produk" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">Koleksi Pakaian Kami</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Temukan pakaian berkualitas dengan harga terjangkau sambil berkontribusi untuk kebaikan.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 mb-8 p-6 bg-secondary/30 rounded-xl">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-foreground mb-2">Kategori</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua</SelectItem>
                <SelectItem value="pria">Pria</SelectItem>
                <SelectItem value="wanita">Wanita</SelectItem>
                <SelectItem value="anak">Anak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-foreground mb-2">Kondisi</label>
            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua</SelectItem>
                <SelectItem value="baru">Baru</SelectItem>
                <SelectItem value="preloved">Preloved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-foreground mb-2">Urutkan</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terbaru">Terbaru</SelectItem>
                <SelectItem value="harga-rendah">Harga Terendah</SelectItem>
                <SelectItem value="harga-tinggi">Harga Tertinggi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="aspect-square bg-secondary/30 relative">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.condition === "Preloved" && (
                  <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">Preloved</Badge>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-2">{product.name}</h3>

                <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Oleh: {product.seller}</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Kondisi: {product.condition}</span>
                  <span className="text-xl font-bold text-primary">Rp {product.price.toLocaleString("id-ID")}</span>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary hover:bg-[#5DBD98] text-primary-foreground font-medium rounded-lg">
                    Tambah ke Keranjang
                  </Button>
                  <Button
                    variant="outline"
                    className="border-primary text-foreground hover:bg-[#ECF8F2] bg-transparent"
                  >
                    Detail
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
