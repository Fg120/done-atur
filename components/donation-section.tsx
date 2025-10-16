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
import { createDonation } from "@/lib/donations"
import { uploadTransferProof } from "@/lib/storage"
import { Info, Upload, Loader2 } from "lucide-react"

export function DonationSection() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    nomorHp: "",
    jenisDonasi: "",
    nominal: "",
    metodePembayaran: "",
    buktiTransfer: null as File | null,
    daftarPakaian: "",
    alamatPenjemputan: "",
    catatan: "",
    anonim: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let transferProofUrl: string | null = null

      // Upload bukti transfer jika ada (untuk donasi uang)
      if (formData.jenisDonasi === "uang" && formData.buktiTransfer) {
        // Generate temporary ID for upload
        const tempId = `donation-${Date.now()}`
        const uploadResult = await uploadTransferProof(formData.buktiTransfer, tempId)

        if (uploadResult.error) {
          toast({
            title: "Error Upload",
            description: uploadResult.error,
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }

        transferProofUrl = uploadResult.url
      }

      // Prepare data for database
      const donationData = {
        donor_name: formData.anonim ? "Donatur Anonim" : formData.nama,
        donor_email: formData.email,
        donor_phone: formData.nomorHp,
        donation_type: formData.jenisDonasi,
        nominal: formData.jenisDonasi === "uang" ? parseFloat(formData.nominal) : null,
        net_amount: formData.jenisDonasi === "uang" ? calculateNetAmount(formData.nominal) : null,
        payment_method: formData.metodePembayaran || null,
        transfer_proof_url: transferProofUrl,
        clothing_list: formData.daftarPakaian || null,
        pickup_address: formData.alamatPenjemputan || null,
        notes: formData.catatan || null,
        is_anonymous: formData.anonim,
        status: "pending",
      }

      const result = await createDonation(donationData)

      if (result.success) {
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
      } else {
        toast({
          title: "Error",
          description: result.error || "Terjadi kesalahan saat mengirim donasi",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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

        <Card className="rounded-xl border border-border bg-[#F8FDF9] p-8 shadow-2xl shadow-slate-800/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground mb-4">Syarat & Ketentuan Donasi</h3>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Donasi Pakaian:</h4>
                  <p className="leading-relaxed">
                    Sebagian kecil dari pakaian yang didonasikan akan dijual untuk menutupi biaya operasional platform,
                    termasuk biaya penjemputan, sortir, dan distribusi. Semua proses ini dilakukan dengan transparansi
                    penuh.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Donasi Uang:</h4>
                  <p className="leading-relaxed">
                    Biaya administrasi sebesar 5% dari nominal donasi akan dipotong untuk biaya operasional platform.
                    Sisa dana akan disalurkan 100% kepada penerima donasi yang telah terverifikasi.
                  </p>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm font-medium text-primary">
                    💡 Semua proses donasi dan penyaluran dapat dipantau secara real-time melalui dashboard transparansi
                    kami.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border border-border bg-card p-8 mt-8 shadow-2xl shadow-slate-800/50">
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
                disabled={formData.anonim || isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                required
              />
            </div>

            {/* 4. Jenis Donasi */}
            <div className="space-y-2">
              <Label>Jenis Donasi</Label>
              <Select value={formData.jenisDonasi} onValueChange={(value) => handleInputChange("jenisDonasi", value)} disabled={isSubmitting}>
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
                      disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="transfer" id="transfer" disabled={isSubmitting} />
                      <Label htmlFor="transfer">Transfer Bank</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ewallet" id="ewallet" disabled={isSubmitting} />
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
                      disabled={isSubmitting}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">Format: JPG, PNG, atau PDF (max 5MB)</p>
                    {formData.buktiTransfer && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ {formData.buktiTransfer.name} ({(formData.buktiTransfer.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>

            {/* 6. Checkbox Donasi anonim */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonim"
                checked={formData.anonim}
                onCheckedChange={(checked) => handleInputChange("anonim", checked as boolean)}
                disabled={isSubmitting}
              />
              <Label htmlFor="anonim" className="text-sm">
                Donasi anonim (nama tidak akan ditampilkan)
              </Label>
            </div>

            {/* 7. Submit button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-[#5DBD98] text-primary-foreground font-medium rounded-lg py-3 text-lg"
              disabled={!formData.jenisDonasi || isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmitting ? "Mengirim..." : "Kirim Donasi"}
            </Button>
          </form>
        </Card>
      </div>
    </section>
  )
}
