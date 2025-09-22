import { Card } from "@/components/ui/card"
import { Info } from "lucide-react"

export function TermsSection() {
  return (
    <section id="terms" className="py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Card className="rounded-xl border border-border bg-[#F8FDF9] shadow-sm p-8">
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
      </div>
    </section>
  )
}
