"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function AdminSettings() {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Implement your settings save logic here
      toast({
        title: "Berhasil",
        description: "Pengaturan telah disimpan",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground mt-2">Kelola pengaturan aplikasi admin.</p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Umum</CardTitle>
            <CardDescription>Konfigurasi dasar aplikasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Nama Aplikasi</Label>
              <Input id="app-name" placeholder="Done Atur" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-description">Deskripsi</Label>
              <Input id="app-description" placeholder="Platform donasi terpercaya" />
            </div>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Sistem</CardTitle>
            <CardDescription>Detil teknis tentang sistem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status Sistem</span>
              <Badge>Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database Connection</span>
              <Badge variant="outline">Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Version</span>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zona Berbahaya</CardTitle>
            <CardDescription>Operasi yang tidak dapat dibatalkan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="destructive" disabled>
              Hapus Semua Data
            </Button>
            <p className="text-xs text-muted-foreground">
              Tindakan ini akan menghapus semua data secara permanen.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
