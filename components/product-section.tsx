"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Loader2 } from "lucide-react"

interface Product {
  id: string
  name: string
  description?: string
  category: string
  condition: string
  price: number
  image: string
  seller: string
}

export function ProductSection() {
  const [selectedCategory, setSelectedCategory] = useState("semua")
  const [selectedCondition, setSelectedCondition] = useState("semua")
  const [sortBy, setSortBy] = useState("terbaru")
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedCategory !== "semua") params.append("category", selectedCategory)
        if (selectedCondition !== "semua") params.append("condition", selectedCondition)
        params.append("sortBy", sortBy === "terbaru" ? "created_at" : sortBy)
        params.append("limit", "12")

        const response = await fetch(`/api/public/products?${params}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data)
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [selectedCategory, selectedCondition, sortBy])

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
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Memuat produk...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-muted-foreground">Tidak ada produk yang sesuai dengan filter</p>
            </div>
          ) : (
            products.map((product: Product) => (
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
            ))
          )}
        </div>
      </div>
    </section>
  )
}
