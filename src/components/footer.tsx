import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Logo } from "@/components/logo"

const TRAKTEER = "https://trakteer.id/m_anas_ubaidillah/gift"
const INSTAGRAM = "https://www.instagram.com/_anasubaid/"

export function Footer() {
  return (
    <footer className="mt-section border-t border-border/70 bg-muted/25">
      <div className="mx-auto grid max-w-[1140px] gap-12 px-6 py-14 sm:grid-cols-[1.5fr_repeat(3,1fr)] sm:gap-8">
        <div className="max-w-xs">
          <p className="flex items-center gap-2 font-heading text-lg font-bold tracking-[-0.02em]">
            <Logo className="h-7 w-7" />
            OpenFrame
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Bikin twibbon multi-slot. Gratis, tanpa email, tanpa nomor telepon.
          </p>
        </div>

        <FooterGroup title="Produk">
          <Link to="/" search={{ q: "", hal: 1 }}>
            Galeri twibbon
          </Link>
          <Link to="/buat">Bikin kampanye</Link>
        </FooterGroup>
        <FooterGroup title="Komunitas">
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href={TRAKTEER} target="_blank" rel="noopener noreferrer">
            Traktir kopi
          </a>
        </FooterGroup>
        <FooterGroup title="OpenFrame">
          <Link to="/login">Masuk</Link>
          <Link to="/register">Buat akun</Link>
        </FooterGroup>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-[1140px] flex-col gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} OpenFrame</span>
          <span>Dibuat untuk kampanye yang ingin dibagikan.</span>
        </div>
      </div>
    </footer>
  )
}

function FooterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">{title}</h2>
      <nav className="mt-4 flex flex-col items-start gap-3 text-sm text-muted-foreground [&_a]:transition-colors [&_a:hover]:text-foreground">
        {children}
      </nav>
    </div>
  )
}
