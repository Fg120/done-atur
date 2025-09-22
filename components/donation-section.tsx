"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"

export function DonationSection() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    nomorHp: "", // Added phone number field
    jenisDonasi: "",
    nominal: "",
    metodePembayaran: "",
    buktiTransfer: null as File | null, // Added file upload field
    daftarPakaian: "", // Added clothing list field
    alamatPenjemputan: "", // Added pickup address field
    catatan: "",
    anonim: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mock submission
    toast({
      title: "Donasi Berhasil Dikirim!",
      description: "Terima kasih atas kontribusi Anda. Tim kami akan segera menghubungi Anda.",
    })

    // Reset form
    setFormData({
      nama: "",
      email: "",
      nomorHp: "",
      jenisDonasi: "",
      nominal: "",
      metodePembayaran: "",
      buktiTransfer: null,
      daftarPakaian: "",
      alamatPenjemputan: "",
      catatan: "",
      anonim: false,
    })
  }

  const handleInputChange = (field: string, value: string | boolean | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleInputChange("buktiTransfer", file)
  }

  const calculateNetAmount = (amount: string) => {
    const numAmount = Number.parseFloat(amount) || 0
    return numAmount * 0.95
  }

  return (
    <section id="donasi" className="py-20 bg-secondary/30">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-6 text-balance">Berdonasi untuk Kebaikan</h2>
          <p className="text-xl text-muted-foreground text-pretty">
            Setiap kontribusi Anda akan disalurkan dengan transparan untuk membantu mereka yang membutuhkan.
          </p>
        </div>

        <Card className="rounded-xl border border-border bg-card shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Nama Lengkap */}
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                type="text"
                value={formData.nama}
                onChange={(e) => handleInputChange("nama", e.target.value)}
                className="rounded-lg"
                required
              />
            </div>

            {/* 2. Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="rounded-lg"
                required
              />
            </div>

            {/* 3. Nomor HP */}
            <div className="space-y-2">
              <Label htmlFor="nomorHp">Nomor HP</Label>
              <Input
                id="nomorHp"
                type="tel"
                value={formData.nomorHp}
                onChange={(e) => handleInputChange("nomorHp", e.target.value)}
                className="rounded-lg"
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>

            {/* 4. Jenis Donasi */}
            <div className="space-y-2">
              <Label>Jenis Donasi</Label>
              <Select value={formData.jenisDonasi} onValueChange={(value) => handleInputChange("jenisDonasi", value)}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Pilih jenis donasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#">Pilih Jenis Donasi</SelectItem>
                  <SelectItem value="uang">Uang</SelectItem>
                  <SelectItem value="pakaian">Pakaian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional fields based on donation type */}
            {formData.jenisDonasi === "uang" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nominal">Nominal Donasi</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">Rp</span>
                    <Input
                      id="nominal"
                      type="number"
                      value={formData.nominal}
                      onChange={(e) => handleInputChange("nominal", e.target.value)}
                      className="pl-10 rounded-lg"
                      placeholder="0"
                      required
                    />
                  </div>
                  {formData.nominal && (
                    <p className="text-sm text-muted-foreground">
                      Jumlah setelah potongan 5%:{" "}
                      <span className="font-medium text-primary">
                        Rp {calculateNetAmount(formData.nominal).toLocaleString("id-ID")}
                      </span>
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Metode Pembayaran</Label>
                  <RadioGroup
                    value={formData.metodePembayaran}
                    onValueChange={(value) => handleInputChange("metodePembayaran", value)}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="transfer" id="transfer" />
                      <Label htmlFor="transfer">Transfer Bank</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ewallet" id="ewallet" />
                      <Label htmlFor="ewallet">E-Wallet</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buktiTransfer">Upload Bukti Transfer</Label>
                  <div className="relative">
                    <Input
                      id="buktiTransfer"
                      type="file"
                      onChange={handleFileChange}
                      className="rounded-lg"
                      accept="image/*,.pdf"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Format: JPG, PNG, atau PDF (max 5MB)</p>
                </div>
              </>
            )}

            {formData.jenisDonasi === "pakaian" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="daftarPakaian">Daftar Pakaian yang Didonasikan</Label>
                  <Textarea
                    id="daftarPakaian"
                    value={formData.daftarPakaian}
                    onChange={(e) => handleInputChange("daftarPakaian", e.target.value)}
                    className="rounded-lg min-h-[100px]"
                    placeholder="Contoh:&#10;- Kemeja putih ukuran L (kondisi baik)&#10;- Celana jeans ukuran 32 (sedikit pudar)&#10;- Jaket hoodie ukuran M (seperti baru)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alamatPenjemputan">Alamat Penjemputan Pakaian</Label>
                  <Textarea
                    id="alamatPenjemputan"
                    value={formData.alamatPenjemputan}
                    onChange={(e) => handleInputChange("alamatPenjemputan", e.target.value)}
                    className="rounded-lg min-h-[80px]"
                    placeholder="Masukkan alamat lengkap untuk penjemputan pakaian..."
                    required
                  />
                </div>
              </>
            )}

            {/* 5. Catatan */}
            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan (Opsional)</Label>
              <Textarea
                id="catatan"
                value={formData.catatan}
                onChange={(e) => handleInputChange("catatan", e.target.value)}
                className="rounded-lg min-h-[100px]"
                placeholder="Tambahkan pesan atau catatan khusus..."
              />
            </div>

            {/* 6. Checkbox Donasi anonim */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonim"
                checked={formData.anonim}
                onCheckedChange={(checked) => handleInputChange("anonim", checked as boolean)}
              />
              <Label htmlFor="anonim" className="text-sm">
                Donasi anonim (nama tidak akan ditampilkan)
              </Label>
            </div>

            {/* 7. Submit button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-[#5DBD98] text-primary-foreground font-medium rounded-lg py-3 text-lg"
              disabled={!formData.jenisDonasi}
            >
              Kirim Donasi
            </Button>
          </form>
        </Card>
      </div>
    </section>
  )
}
