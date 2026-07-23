import { Link } from '@tanstack/react-router'
import { Logo } from '@/components/logo'

/** Tautan dukungan dipertahankan dari aplikasi lama (spec bagian 7). */
const TRAKTEER = 'https://trakteer.id/m_anas_ubaidillah/gift'
const INSTAGRAM = 'https://www.instagram.com/_anasubaid/'

/*
 * ponytail: struktur footer uikit dipinjam, isinya tidak. Kit itu punya lima
 * kolom untuk produk SaaS — Product, Resources, Company. OpenFrame gratis dan
 * berfungsi tunggal, jadi menyalin kolomnya berarti memasang tautan yang tidak
 * menuju ke mana-mana.
 */
export function Footer() {
  return (
    <footer className="mt-section border-t border-border">
      <div className="mx-auto flex max-w-[1140px] flex-col gap-6 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="flex items-center gap-2 font-heading text-lg font-bold tracking-[-0.02em]">
            <Logo className="h-6 w-6" />
            OpenFrame
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Bikin twibbon multi-slot. Gratis, tanpa email, tanpa nomor telepon. Foto kamu diproses
            di browser dan tidak pernah dikirim ke mana pun.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm" aria-label="Tautan footer">
          <Link
            to="/"
            search={{ q: '', hal: 1 }}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Galeri
          </Link>
          <Link
            to="/buat"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Bikin kampanye
          </Link>
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Instagram
          </a>
          <a
            href={TRAKTEER}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Traktir kopi
          </a>
        </nav>
      </div>
    </footer>
  )
}
