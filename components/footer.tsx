import { Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer id="kontak" className="bg-foreground text-background py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Tagline */}
          <div className="space-y-4">
            <div className="text-2xl font-bold">Done-Atur</div>
            <p className="text-sm text-background/80 leading-relaxed">
              Mengatur kebaikan melalui donasi dan penjualan pakaian yang transparan dan berdampak sosial.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Tautan</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#hero" className="text-background/80 hover:text-background transition-colors">
                  Beranda
                </a>
              </li>
              <li>
                <a href="#about" className="text-background/80 hover:text-background transition-colors">
                  Tentang
                </a>
              </li>
              <li>
                <a href="#produk" className="text-background/80 hover:text-background transition-colors">
                  Produk
                </a>
              </li>
              <li>
                <a href="#donasi" className="text-background/80 hover:text-background transition-colors">
                  Donasi
                </a>
              </li>
              <li>
                <a href="#kontak" className="text-background/80 hover:text-background transition-colors">
                  Kontak
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Kontak</h3>
            <div className="space-y-2 text-sm text-background/80">
              <p>Email: info@done-atur.com</p>
              <p>Telepon: +62 21 1234 5678</p>
              <p>Alamat: Jl. Kebaikan No. 123, Jakarta</p>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Ikuti Kami</h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center">
          <p className="text-sm text-background/60">© {currentYear} Done-Atur. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}
