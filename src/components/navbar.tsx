import { Coffee, User } from '@phosphor-icons/react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button, buttonVariants } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { pesanError } from '@/lib/pesan-error'

/** Tautan dukungan dipertahankan dari aplikasi lama (spec bagian 7). */
const TRAKTEER = 'https://trakteer.id/m_anas_ubaidillah/gift'

type Props = {
  /** Kalau ada, navbar menampilkan chip user dan tombol keluar. */
  username?: string
}

export function Navbar({ username }: Props) {
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    setLogoutError('')
    try {
      await authClient.signOut()
      navigate({ to: '/login' })
    } catch (err) {
      // signOut bisa MELEMPAR saat jaringan putus — tanpa ini tombolnya
      // tidak melakukan apa pun yang terlihat.
      setLogoutError(pesanError(err))
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-[58px] max-w-[1140px] items-center justify-between px-6">
        <Link
          to={username ? '/dashboard' : '/'}
          className="font-heading text-[1.15rem] font-extrabold tracking-[-0.5px] text-foreground no-underline"
        >
          OpenFrame
        </Link>

        <div className="flex items-center gap-2">
          {/* Base UI memakai prop `render`, bukan `asChild`. Untuk tautan,
              memakai buttonVariants sebagai className lebih tahan banting
              daripada menebak API komposisinya. */}
          <a
            href={TRAKTEER}
            target="_blank"
            rel="noopener noreferrer"
            title="Traktir kopi"
            className={buttonVariants({ variant: 'outline', size: 'sm', className: 'bg-muted' })}
          >
            <Coffee aria-hidden /> <span className="hidden sm:inline">Support</span>
          </a>

          <ThemeToggle />

          {username && (
            <>
              <span className="hidden rounded-lg border border-border bg-muted px-2.5 py-1 text-[0.82rem] text-muted-foreground sm:inline">
                <User aria-hidden className="inline align-[-2px]" /> {username}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Keluar
              </Button>
            </>
          )}
        </div>
      </nav>

      {logoutError && (
        <p
          role="alert"
          className="bg-destructive/10 px-6 py-2 text-center text-sm text-destructive"
        >
          {logoutError}
        </p>
      )}
    </header>
  )
}
