import {
  Camera01Icon,
  Coffee01Icon,
  FileUploadIcon,
  Logout01Icon,
  Settings01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { useRef, useState } from "react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { pesanError } from "@/lib/pesan-error"
import { cn } from "@/lib/utils"
import { changePassword, uploadAvatar } from "@/server/auth"

const TRAKTEER = "https://trakteer.id/m_anas_ubaidillah/gift"

type Props = {
  username?: string
}

export function Navbar({ username }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { data: session, refetch } = authClient.useSession()
  const [logoutError, setLogoutError] = useState("")
  const displayName = session?.user.name ?? username
  const loggedIn = Boolean(session?.user)

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  // Avatar upload state
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(session?.user.image ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const itemKelas = (aktif: boolean) =>
    cn(
      "rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
      aktif && "bg-muted text-foreground",
    )

  async function handleLogout() {
    setLogoutError("")
    try {
      await authClient.signOut()
      navigate({ to: "/login" })
    } catch (err) {
      setLogoutError(pesanError(err))
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess("")
    setPasswordLoading(true)
    try {
      await changePassword({ data: { currentPassword, newPassword } })
      setPasswordSuccess("Password berhasil diubah!")
      setCurrentPassword("")
      setNewPassword("")
      setTimeout(() => setPasswordDialogOpen(false), 1500)
    } catch (err) {
      setPasswordError(pesanError(err))
    } finally {
      setPasswordLoading(false)
    }
  }

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Ukuran gambar maksimal 5MB")
      return
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setAvatarError("Format gambar harus PNG, JPG, atau WebP")
      return
    }
    setAvatarFile(file)
    setAvatarError("")
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleAvatarUpload() {
    if (!avatarFile) return
    setAvatarError("")
    setAvatarLoading(true)
    try {
      const ext = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
      }[avatarFile.type as "image/png" | "image/jpeg" | "image/webp"]
      if (!ext) {
        setAvatarError("Format gambar harus PNG, JPG, atau WebP")
        return
      }
      const reader = new FileReader()
      const data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(avatarFile)
      })
      await uploadAvatar({ data: { data, ext } })
      setAvatarFile(null)
      setAvatarDialogOpen(false)
      await refetch()
    } catch (err) {
      setAvatarError(pesanError(err))
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <nav className="mx-auto flex min-h-[68px] max-w-[1140px] items-center justify-between gap-6 px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            to="/"
            search={{ q: "", hal: 1 }}
            aria-label="OpenFrame"
            className="flex shrink-0 items-center gap-2.5 font-heading text-[1.1rem] font-extrabold tracking-[-0.5px] text-foreground no-underline"
          >
            <Logo className="h-8 w-8" />
            <span className="hidden sm:inline">OpenFrame</span>
          </Link>

          <div className="hidden items-center gap-1 text-sm font-medium md:flex">
            {loggedIn && (
              <Link to="/dashboard" className={itemKelas(pathname === "/dashboard")}>
                Dashboard
              </Link>
            )}
            <Link to="/" search={{ q: "", hal: 1 }} className={itemKelas(pathname === "/")}>
              Galeri
            </Link>
            <Link to="/buat" className={itemKelas(pathname === "/buat")}>
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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Menu akun"
                    className="bg-muted"
                  />
                }
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="size-4.5 rounded-full object-cover"
                  />
                ) : (
                  <HugeiconsIcon icon={UserIcon} aria-hidden />
                )}
                <span className="hidden max-w-28 truncate sm:inline">{displayName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setAvatarDialogOpen(true)}>
                    <HugeiconsIcon icon={Camera01Icon} aria-hidden />
                    Ganti Foto Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)}>
                    <HugeiconsIcon icon={Settings01Icon} aria-hidden />
                    Ganti Password
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <HugeiconsIcon icon={Logout01Icon} aria-hidden />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
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

      {/* Password change dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Password</DialogTitle>
            <DialogDescription>Masukkan password lama dan password baru kamu.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="grid gap-4">
            {passwordError && (
              <Alert variant="destructive" role="alert">
                {passwordError}
              </Alert>
            )}
            {passwordSuccess && <Alert role="alert">{passwordSuccess}</Alert>}
            <div className="grid gap-2">
              <Label htmlFor="current-password">Password saat ini</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">Password baru</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false)
                  setPasswordError("")
                  setPasswordSuccess("")
                  setCurrentPassword("")
                  setNewPassword("")
                }}
              >
                Batal
              </Button>
              <Button type="submit" isLoading={passwordLoading} disabled={passwordLoading}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Avatar upload dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Foto Profil</DialogTitle>
            <DialogDescription>Pilih foto baru (PNG, JPG, atau WebP, maks 5MB).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {avatarError && (
              <Alert variant="destructive" role="alert">
                {avatarError}
              </Alert>
            )}
            {avatarPreview && (
              <div className="flex justify-center">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="size-24 rounded-full border-2 border-border object-cover"
                />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarSelect}
              className="hidden"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAvatarDialogOpen(false)
                  setAvatarFile(null)
                  setAvatarError("")
                  setAvatarPreview(session?.user.image ?? null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
              >
                Batal
              </Button>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <HugeiconsIcon icon={FileUploadIcon} aria-hidden />
                Pilih Foto
              </Button>
              <Button
                type="button"
                isLoading={avatarLoading}
                disabled={!avatarFile || avatarLoading}
                onClick={handleAvatarUpload}
              >
                Simpan
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
