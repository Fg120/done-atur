"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useLoaderFade } from "@/hooks/use-loader-fade"
import { getDonations, updateDonationStatus, deleteDonation } from "@/lib/donations"
import { Loader2, Trash2, Eye, FileText, Image as ImageIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface Donation {
  id: string
  donor_name: string
  donor_email: string
  donor_phone: string
  donation_type: "uang" | "pakaian"
  nominal: number | null
  net_amount: number | null
  payment_method: string | null
  transfer_proof_url: string | null
  clothing_list: string | null
  quantity: number | null
  pickup_address: string | null
  notes: string | null
  is_anonymous: boolean
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

export default function DonationsPage() {
  useLoaderFade()
  const { toast } = useToast()
  const [donations, setDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchEmail, setSearchEmail] = useState("")
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadDonations()
  }, [])

  const loadDonations = async () => {
    setIsLoading(true)
    try {
      const filters = {
        status: statusFilter !== "all" ? statusFilter : undefined,
        email: searchEmail || undefined,
      }

      const result = await getDonations(filters)

      if (result.success) {
        setDonations(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal memuat data donasi",
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
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    setIsUpdating(true)
    try {
      const result = await updateDonationStatus(id, newStatus)

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Status donasi berhasil diperbarui",
        })

        // Update local state
        setDonations(
          donations.map((d) => (d.id === id ? { ...d, status: newStatus as any } : d))
        )

        // Update selected donation if it's the one being updated
        if (selectedDonation?.id === id) {
          setSelectedDonation({ ...selectedDonation, status: newStatus as any })
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal mengubah status",
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
      setIsUpdating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus donasi ini?")) return

    try {
      const result = await deleteDonation(id)

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Donasi berhasil dihapus",
        })

        setDonations(donations.filter((d) => d.id !== id))
        setShowDetailDialog(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal menghapus donasi",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Menunggu"
      case "approved":
        return "Disetujui"
      case "rejected":
        return "Ditolak"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manajemen Donasi</h1>
        <p className="text-muted-foreground mt-2">Kelola dan pantau semua donasi yang masuk</p>
      </div>

      {/* Filter Section */}
      <Card className="p-6 border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Filter Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status" className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Cari Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Masukkan email donatur..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2 flex flex-col justify-end">
            <Button
              onClick={loadDonations}
              className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Cari
            </Button>
          </div>
        </div>
      </Card>

      {/* Donations Table/List */}
      <Card className="border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Memuat data...</span>
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tidak ada data donasi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Donatur</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Jenis</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nominal/Detail</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Tanggal</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-secondary/20">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {donation.is_anonymous ? "Donatur Anonim" : donation.donor_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{donation.donor_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="rounded-full">
                        {donation.donation_type === "uang" ? "💰 Uang" : "👕 Pakaian"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {donation.donation_type === "uang" ? (
                        <div>
                          <p className="font-medium">
                            Rp {(donation.nominal || 0).toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Netto: Rp {(donation.net_amount || 0).toLocaleString("id-ID")}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs">{donation.clothing_list?.substring(0, 50)}...</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={donation.status}
                        onValueChange={(value) => handleStatusChange(donation.id, value)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className={`w-32 rounded-lg ${getStatusColor(donation.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Menunggu</SelectItem>
                          <SelectItem value="approved">Disetujui</SelectItem>
                          <SelectItem value="rejected">Ditolak</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(donation.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDonation(donation)
                            setShowDetailDialog(true)
                          }}
                          className="rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(donation.id)}
                          className="rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl rounded-lg">
          <DialogHeader>
            <DialogTitle>Detail Donasi</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang donasi yang dipilih
            </DialogDescription>
          </DialogHeader>

          {selectedDonation && (
            <div className="space-y-4 mt-4">
              {/* Donatur Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-muted-foreground">Nama Donatur</p>
                  <p className="font-medium">
                    {selectedDonation.is_anonymous ? "Donatur Anonim" : selectedDonation.donor_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedDonation.donor_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nomor HP</p>
                  <p className="font-medium">{selectedDonation.donor_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jenis Donasi</p>
                  <p className="font-medium">
                    {selectedDonation.donation_type === "uang" ? "Uang" : "Pakaian"}
                  </p>
                </div>
              </div>

              {/* Donation Details */}
              {selectedDonation.donation_type === "uang" ? (
                <div className="space-y-3 pb-4 border-b">
                  <h4 className="font-semibold">Detail Donasi Uang</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nominal</p>
                      <p className="font-medium">
                        Rp {(selectedDonation.nominal || 0).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nominal Netto (setelah 5%)</p>
                      <p className="font-medium text-green-600">
                        Rp {(selectedDonation.net_amount || 0).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Metode Pembayaran</p>
                      <p className="font-medium">
                        {selectedDonation.payment_method === "transfer"
                          ? "Transfer Bank"
                          : "E-Wallet"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bukti Transfer</p>
                      {selectedDonation.transfer_proof_url ? (
                        <div className="mt-2">
                          {selectedDonation.transfer_proof_url.endsWith(".pdf") ? (
                            <a
                              href={selectedDonation.transfer_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary hover:underline"
                            >
                              <FileText className="w-4 h-4" />
                              Lihat PDF
                            </a>
                          ) : (
                            <div className="space-y-2">
                              <img
                                src={selectedDonation.transfer_proof_url}
                                alt="Bukti Transfer"
                                className="max-w-xs h-auto rounded-lg border border-border"
                              />
                              <a
                                href={selectedDonation.transfer_proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
                              >
                                <ImageIcon className="w-4 h-4" />
                                Buka Gambar
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">Belum diupload</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pb-4 border-b">
                  <h4 className="font-semibold">Detail Donasi Pakaian</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Jumlah Pakaian</p>
                      <p className="font-medium text-lg">{selectedDonation.quantity || 0} pcs</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Daftar Pakaian</p>
                    <p className="text-sm whitespace-pre-wrap bg-secondary/30 p-3 rounded-lg">
                      {selectedDonation.clothing_list}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Alamat Penjemputan</p>
                    <p className="text-sm whitespace-pre-wrap bg-secondary/30 p-3 rounded-lg">
                      {selectedDonation.pickup_address}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes & Status */}
              <div className="space-y-3">
                {selectedDonation.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Catatan</p>
                    <p className="text-sm whitespace-pre-wrap bg-secondary/30 p-3 rounded-lg">
                      {selectedDonation.notes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={`rounded-full ${getStatusColor(selectedDonation.status)} mt-2`}>
                      {getStatusLabel(selectedDonation.status)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Dibuat</p>
                    <p className="font-medium">
                      {new Date(selectedDonation.created_at).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(selectedDonation.id)
                  }}
                  className="flex-1 rounded-lg"
                >
                  Hapus
                </Button>
                <Button
                  onClick={() => setShowDetailDialog(false)}
                  className="flex-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
