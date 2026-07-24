import {
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  CopyLinkIcon,
  SecurityWarningIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pesanError } from "@/lib/pesan-error"
import { resetPassword } from "@/server/auth"

export const Route = createFileRoute("/lupa-password")({ component: LupaPasswordPage })

const labelClass = "mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"

/**
 * Pesan seragam untuk "username tidak ada" maupun "recovery code salah" —
 * lihat komentar di server/auth.ts. Ditampilkan apa adanya (BUKAN lewat
 * pesanError) karena ini bukan pesan asing pihak ketiga, melainkan pesan
 * keamanan yang sengaja ditulis identik untuk mencegah enumerasi username.
 */
const PESAN_RESET_GAGAL = "Username atau recovery code salah"

function LupaPasswordPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [nextCode, setNextCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (newPassword !== confirm) {
      setError("Password baru dan konfirmasi tidak cocok")
      return
    }
    setLoading(true)
    try {
      const result = await resetPassword({ data: { username, recoveryCode, newPassword } })
      setNextCode(result.recoveryCode)
    } catch (err) {
      setError(
        err instanceof Error && err.message === PESAN_RESET_GAGAL ? err.message : pesanError(err),
      )
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(nextCode)
      setCopyError("")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      setCopyError("Gagal menyalin otomatis. Salin kode di atas secara manual.")
    }
  }

  useEffect(() => {
    if (!nextCode) return
    successHeadingRef.current?.focus()
  }, [nextCode])

  useEffect(() => {
    if (!nextCode || confirmed) return
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [nextCode, confirmed])

  if (nextCode) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md p-9">
          <h1
            ref={successHeadingRef}
            tabIndex={-1}
            className="mb-1 flex items-center gap-2 font-heading text-2xl outline-none"
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} aria-hidden className="text-primary" />{" "}
            Reset Berhasil
          </h1>
          <p className="mb-7 text-sm text-muted-foreground">
            Password berhasil diperbarui. Recovery code lama sudah tidak berlaku — simpan yang baru
            ini.
          </p>

          <output className="mb-5 block rounded-lg border-2 border-dashed border-primary bg-muted p-5 text-center font-mono tracking-widest text-primary">
            {nextCode}
          </output>

          <Alert variant="destructive" className="mb-4">
            <HugeiconsIcon icon={SecurityWarningIcon} aria-hidden /> Ini recovery code barumu.
            Simpan sekarang sebelum menutup halaman.
          </Alert>

          {copyError && (
            <Alert variant="destructive" role="alert" className="mb-3">
              {copyError}
            </Alert>
          )}

          <Button type="button" variant="outline" onClick={copyCode} className="mb-3">
            {copied ? (
              <>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} aria-hidden /> Tersalin!
              </>
            ) : (
              <>
                <HugeiconsIcon icon={CopyLinkIcon} aria-hidden /> Salin Recovery Code Baru
              </>
            )}
          </Button>

          <Label className="mb-3 flex items-start gap-2 text-sm font-normal text-muted-foreground">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
              className="mt-0.5"
            />
            Saya sudah menyimpan recovery code ini di tempat aman
          </Label>

          <Button type="button" disabled={!confirmed} onClick={() => navigate({ to: "/login" })}>
            Lanjut ke Halaman Masuk <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="fixed right-5 top-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md p-9">
        <h1 className="mb-1 font-heading text-2xl">Reset Password</h1>
        <p className="mb-7 text-sm text-muted-foreground">
          Masukkan username dan recovery code yang kamu simpan saat mendaftar
        </p>

        {error && (
          <Alert variant="destructive" role="alert" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="username" className={labelClass}>
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="username kamu"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="recovery" className={labelClass}>
              Recovery Code
            </Label>
            <Input
              id="recovery"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              required
              placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
              className="font-mono tracking-wide"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="new-password" className={labelClass}>
              Password Baru <span className="normal-case tracking-normal">min. 6 karakter</span>
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="mb-6">
            <Label htmlFor="confirm-password" className={labelClass}>
              Konfirmasi Password Baru
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? (
              "Memproses..."
            ) : (
              <>
                Reset Password <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ingat password?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </Card>
    </main>
  )
}
