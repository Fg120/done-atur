"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useLoaderFade } from "@/hooks/use-loader-fade"
import { Loader2, Trash2, Eye, Plus, X, Upload } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface Accountability {
    id: string
    location: string
    activity_date: string
    description: string
    donation_ids: string[]
    photo_urls: string[] | null
    created_by: string
    created_at: string
    updated_at: string
}

interface Donation {
    id: string
    donor_name: string
    donor_email: string
    donation_type: "uang" | "pakaian"
    nominal: number | null
    net_amount: number | null
    status: string
}

export default function AccountabilityPage() {
    useLoaderFade()
    const { toast } = useToast()
    const [accountabilities, setAccountabilities] = useState<Accountability[]>([])
    const [allDonations, setAllDonations] = useState<Donation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [showDialog, setShowDialog] = useState(false)
    const [selectedAccountability, setSelectedAccountability] = useState<Accountability | null>(null)
    const [searchDate, setSearchDate] = useState("")

    // Form state
    const [formData, setFormData] = useState({
        location: "",
        activity_date: "",
        description: "",
        donation_ids: [] as string[],
        photo_urls: [] as string[],
    })
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        try {
            // Load accountabilities
            const response = await fetch("/api/admin/accountability")
            if (response.ok) {
                const data = await response.json()
                setAccountabilities(data)
            }

            // Load all donations for selection
            const donationsResponse = await fetch("/api/admin/donations/list")
            if (donationsResponse.ok) {
                const donations = await donationsResponse.json()
                setAllDonations(donations)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Gagal memuat data",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateAccountability = async () => {
        if (!formData.location || !formData.activity_date || !formData.description || formData.donation_ids.length === 0) {
            toast({
                title: "Error",
                description: "Semua field harus diisi",
                variant: "destructive",
            })
            return
        }

        setIsCreating(true)
        try {
            const response = await fetch("/api/admin/accountability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                toast({
                    title: "Berhasil",
                    description: "Pertanggungjawaban berhasil dibuat",
                })
                setFormData({ location: "", activity_date: "", description: "", donation_ids: [] })
                setShowDialog(false)
                await loadData()
            } else {
                const error = await response.json()
                toast({
                    title: "Error",
                    description: error.error || "Gagal membuat pertanggungjawaban",
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
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus pertanggungjawaban ini?")) return

        try {
            const response = await fetch(`/api/admin/accountability?id=${id}`, {
                method: "DELETE",
            })

            if (response.ok) {
                toast({
                    title: "Berhasil",
                    description: "Pertanggungjawaban berhasil dihapus",
                })
                await loadData()
            } else {
                const error = await response.json()
                toast({
                    title: "Error",
                    description: error.error || "Gagal menghapus",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Terjadi kesalahan",
                variant: "destructive",
            })
        }
    }

    const toggleDonationSelection = (donationId: string) => {
        setFormData((prev) => ({
            ...prev,
            donation_ids: prev.donation_ids.includes(donationId)
                ? prev.donation_ids.filter((id) => id !== donationId)
                : [...prev.donation_ids, donationId],
        }))
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        setIsUploadingPhoto(true)
        try {
            const uploadedUrls: string[] = []

            for (let i = 0; i < files.length && formData.photo_urls.length + uploadedUrls.length < 10; i++) {
                const file = files[i]
                const formDataUpload = new FormData()
                formDataUpload.append("file", file)
                formDataUpload.append("folder", "accountability")

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formDataUpload,
                })

                if (response.ok) {
                    const data = await response.json()
                    uploadedUrls.push(data.url)
                }
            }

            if (uploadedUrls.length > 0) {
                setFormData((prev) => ({
                    ...prev,
                    photo_urls: [...(prev.photo_urls || []), ...uploadedUrls],
                }))
                toast({
                    title: "Berhasil",
                    description: `${uploadedUrls.length} foto berhasil diunggah`,
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Gagal mengupload foto",
                variant: "destructive",
            })
        } finally {
            setIsUploadingPhoto(false)
            if (e.target) e.target.value = ""
        }
    }

    const removePhoto = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            photo_urls: prev.photo_urls.filter((_, i) => i !== index),
        }))
    }

    const getSelectedDonationsInfo = () => {
        return formData.donation_ids
            .map((id) => allDonations.find((d) => d.id === id))
            .filter(Boolean) as Donation[]
    }

    const filteredAccountabilities = accountabilities.filter((acc) => {
        if (searchDate) {
            return acc.activity_date.includes(searchDate)
        }
        return true
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Pertanggungjawaban Donasi</h1>
                <p className="text-muted-foreground mt-2">Kelola laporan pertanggungjawaban penyaluran donasi</p>
            </div>

            {/* Filter & Create */}
            <Card className="p-6 border-border">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <Label htmlFor="date">Cari Tanggal</Label>
                        <Input
                            id="date"
                            type="date"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            className="rounded-lg"
                        />
                    </div>
                    <Button
                        onClick={() => setShowDialog(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Pertanggungjawaban
                    </Button>
                </div>
            </Card>

            {/* List */}
            <Card className="border-border overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Memuat data...</span>
                    </div>
                ) : filteredAccountabilities.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Tidak ada data pertanggungjawaban</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary/30 border-b border-border">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Tempat</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Tanggal</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Donasi</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Keterangan</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredAccountabilities.map((acc) => (
                                    <tr key={acc.id} className="hover:bg-secondary/20">
                                        <td className="px-6 py-4 font-medium text-foreground">{acc.location}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {new Date(acc.activity_date).toLocaleDateString("id-ID")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline">{acc.donation_ids.length} donasi</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                                            {acc.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedAccountability(acc)
                                                        setShowDialog(true)
                                                    }}
                                                    className="rounded-lg"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(acc.id)}
                                                    className="rounded-lg text-red-600 hover:text-red-700"
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

            {/* Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedAccountability ? "Detail Pertanggungjawaban" : "Buat Pertanggungjawaban"}</DialogTitle>
                        <DialogDescription>
                            {selectedAccountability
                                ? "Informasi pertanggungjawaban penyaluran donasi"
                                : "Buat laporan pertanggungjawaban penyaluran donasi dengan detail lokasi, tanggal, dan donasi yang disalurkan"}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAccountability ? (
                        // View mode
                        <div className="space-y-4">
                            <div>
                                <Label className="text-foreground">Tempat</Label>
                                <p className="text-muted-foreground mt-1">{selectedAccountability.location}</p>
                            </div>
                            <div>
                                <Label className="text-foreground">Tanggal</Label>
                                <p className="text-muted-foreground mt-1">
                                    {new Date(selectedAccountability.activity_date).toLocaleDateString("id-ID")}
                                </p>
                            </div>
                            <div>
                                <Label className="text-foreground">Keterangan</Label>
                                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{selectedAccountability.description}</p>
                            </div>
                            <div>
                                <Label className="text-foreground">Donasi Disalurkan ({selectedAccountability.donation_ids.length})</Label>
                                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                                    {selectedAccountability.donation_ids.map((donId) => {
                                        const donation = allDonations.find((d) => d.id === donId)
                                        return donation ? (
                                            <div key={donId} className="p-2 bg-secondary/20 rounded border border-border text-sm">
                                                <p className="font-medium">{donation.donor_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {donation.donation_type === "uang" ? "💰 Uang" : "👕 Pakaian"}{" "}
                                                    {donation.donation_type === "uang"
                                                        ? `Rp ${(donation.net_amount || 0).toLocaleString("id-ID")}`
                                                        : ""}
                                                </p>
                                            </div>
                                        ) : null
                                    })}
                                </div>
                            </div>

                            {selectedAccountability.photo_urls && selectedAccountability.photo_urls.length > 0 && (
                                <div>
                                    <Label className="text-foreground">Dokumentasi Foto</Label>
                                    <div className="grid grid-cols-3 gap-3 mt-3">
                                        {selectedAccountability.photo_urls.map((url, index) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt={`Documentation ${index + 1}`}
                                                className="w-full h-24 object-cover rounded border border-border cursor-pointer hover:opacity-80 transition"
                                                onClick={() => window.open(url, "_blank")}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <Button onClick={() => setShowDialog(false)} className="w-full">
                                Tutup
                            </Button>
                        </div>
                    ) : (
                        // Create mode
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="location">Tempat Penyaluran</Label>
                                <Input
                                    id="location"
                                    placeholder="Contoh: Yayasan XYZ, Panti Asuhan ABC"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="mt-1 rounded-lg"
                                />
                            </div>

                            <div>
                                <Label htmlFor="date">Tanggal Penyaluran</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.activity_date}
                                    onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                                    className="mt-1 rounded-lg"
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Keterangan</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Jelaskan detail penyaluran donasi..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="mt-1 rounded-lg"
                                    maxLength={2000}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formData.description.length}/2000 karakter
                                </p>
                            </div>

                            <div>
                                <Label className="text-foreground mb-3 block">Pilih Donasi yang Disalurkan</Label>
                                <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3">
                                    {allDonations.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Tidak ada donasi yang tersedia</p>
                                    ) : (
                                        allDonations.map((donation) => (
                                            <label key={donation.id} className="flex items-center gap-2 p-2 hover:bg-secondary/30 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.donation_ids.includes(donation.id)}
                                                    onChange={() => toggleDonationSelection(donation.id)}
                                                    className="rounded"
                                                />
                                                <div className="flex-1 text-sm">
                                                    <p className="font-medium">
                                                        {donation.donor_name} - {donation.donation_type === "uang" ? "💰 Uang" : "👕 Pakaian"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {donation.donation_type === "uang"
                                                            ? `Rp ${(donation.net_amount || 0).toLocaleString("id-ID")}`
                                                            : donation.donation_type}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {donation.status}
                                                </Badge>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {formData.donation_ids.length} donasi dipilih
                                </p>

                                {/* Selected donations summary */}
                                {getSelectedDonationsInfo().length > 0 && (
                                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm font-medium text-foreground mb-2">Ringkasan Donasi Terpilih:</p>
                                        <div className="space-y-1 text-sm">
                                            <p>
                                                Total: Rp{" "}
                                                {getSelectedDonationsInfo()
                                                    .reduce((sum, d) => sum + (d.net_amount || 0), 0)
                                                    .toLocaleString("id-ID")}
                                            </p>
                                            <p>Donasi Uang: {getSelectedDonationsInfo().filter((d) => d.donation_type === "uang").length}</p>
                                            <p>Donasi Pakaian: {getSelectedDonationsInfo().filter((d) => d.donation_type === "pakaian").length}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label className="text-foreground mb-3 block">Foto Dokumentasi (Opsional)</Label>
                                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-secondary/20 transition">
                                    <label className="cursor-pointer">
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="w-6 h-6 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                Klik untuk upload atau drag & drop
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                PNG, JPG, JPEG (Max 10 MB per file)
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            disabled={isUploadingPhoto || formData.photo_urls.length >= 10}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {/* Photo preview */}
                                {formData.photo_urls.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-foreground mb-3">
                                            Foto Terpilih ({formData.photo_urls.length}/10)
                                        </p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {formData.photo_urls.map((url, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={url}
                                                        alt={`Photo ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded border border-border"
                                                    />
                                                    <button
                                                        onClick={() => removePhoto(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleCreateAccountability}
                                    disabled={isCreating || isUploadingPhoto}
                                    className="flex-1 bg-primary hover:bg-primary/90"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Simpan
                                </Button>
                                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                                    Batal
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
