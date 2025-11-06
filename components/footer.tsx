import { Facebook, Instagram, Loader2, Twitter } from "lucide-react"

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
              <p>Email: info.doneatur@gmail.com</p>
              <p>Telepon: +62 857-3021-1766 (Cindy)</p>
              <p>Alamat: Jl. Kalimantan No. 37, Kampus Tegalboto, Jember</p>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Ikuti Kami</h3>
            <div className="flex space-x-4">
              <a
                target="_blank"
                href="https://www.instagram.com/doneatur.perintis?utm_source=ig_web_button_share_sheet&igsh=MWlyMGxlZjFmZDRzcw=="
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                target="_blank"
                href="https://wa.me/+6285730211766"
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path fill="#ffffff" d="M16.6 14c-.2-.1-1.5-.7-1.7-.8c-.2-.1-.4-.1-.6.1c-.2.2-.6.8-.8 1c-.1.2-.3.2-.5.1c-.7-.3-1.4-.7-2-1.2c-.5-.5-1-1.1-1.4-1.7c-.1-.2 0-.4.1-.5c.1-.1.2-.3.4-.4c.1-.1.2-.3.2-.4c.1-.1.1-.3 0-.4c-.1-.1-.6-1.3-.8-1.8c-.1-.7-.3-.7-.5-.7h-.5c-.2 0-.5.2-.6.3c-.6.6-.9 1.3-.9 2.1c.1.9.4 1.8 1 2.6c1.1 1.6 2.5 2.9 4.2 3.7c.5.2.9.4 1.4.5c.5.2 1 .2 1.6.1c.7-.1 1.3-.6 1.7-1.2c.2-.4.2-.8.1-1.2l-.4-.2m2.5-9.1C15.2 1 8.9 1 5 4.9c-3.2 3.2-3.8 8.1-1.6 12L2 22l5.3-1.4c1.5.8 3.1 1.2 4.7 1.2c5.5 0 9.9-4.4 9.9-9.9c.1-2.6-1-5.1-2.8-7m-2.7 14c-1.3.8-2.8 1.3-4.4 1.3c-1.5 0-2.9-.4-4.2-1.1l-.3-.2l-3.1.8l.8-3l-.2-.3c-2.4-4-1.2-9 2.7-11.5S16.6 3.7 19 7.5c2.4 3.9 1.3 9-2.6 11.4" /></svg>
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
