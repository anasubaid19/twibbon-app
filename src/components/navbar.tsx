import { Coffee01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button, buttonVariants } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { pesanError } from "@/lib/pesan-error"

const TRAKTEER = "https://trakteer.id/m_anas_ubaidillah/gift"

type Props = {
  username?: string
}

export function Navbar({ username }: Props) {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  const [logoutError, setLogoutError] = useState("")
  const displayName = session?.user.name ?? username

  async function handleLogout() {
    setLogoutError("")
    try {
      await authClient.signOut()
      navigate({ to: "/login" })
    } catch (err) {
      setLogoutError(pesanError(err))
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <nav className="mx-auto flex min-h-[68px] max-w-[1140px] items-center justify-between gap-6 px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            to={session?.user ? "/dashboard" : "/"}
            aria-label="OpenFrame"
            className="flex shrink-0 items-center gap-2.5 font-heading text-[1.1rem] font-extrabold tracking-[-0.5px] text-foreground no-underline"
          >
            <Logo className="h-8 w-8" />
            <span className="hidden sm:inline">OpenFrame</span>
          </Link>

          <div className="hidden items-center gap-1 text-sm font-medium md:flex">
            <Link
              to="/"
              search={{ q: "", hal: 1 }}
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Galeri
            </Link>
            <Link
              to="/buat"
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Bikin kampanye
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <a
              href={TRAKTEER}
              target="_blank"
              rel="noopener noreferrer"
              title="Traktir kopi"
              className={`${buttonVariants({ variant: "ghost", size: "sm" })} text-muted-foreground`}
            >
              <HugeiconsIcon icon={Coffee01Icon} aria-hidden /> Support
            </a>
          </div>

          <ThemeToggle />

          {session?.user ? (
            <>
              <span className="hidden rounded-lg border border-border bg-muted px-2.5 py-1.5 text-[0.8rem] text-muted-foreground lg:inline-flex lg:items-center lg:gap-1.5">
                <HugeiconsIcon icon={UserIcon} aria-hidden />
                {displayName}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Keluar
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Masuk
              </Link>
              <Link to="/buat" className={buttonVariants({ size: "sm" })}>
                <span className="hidden sm:inline">Bikin twibbon</span>
                <span className="sm:hidden">Mulai</span>
              </Link>
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
