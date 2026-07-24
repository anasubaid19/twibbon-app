import {
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  CopyLinkIcon,
  Key01Icon,
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
import { registerUser } from "@/server/auth"

export const Route = createFileRoute("/register")({ component: RegisterPage })

function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const recoveryHeadingRef = useRef<HTMLHeadingElement>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await registerUser({ data: { username, password } })
      setRecoveryCode(result.recoveryCode)
    } catch (err) {
      setError(pesanError(err))
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(recoveryCode)
      setCopyError("")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      setCopyError("Gagal menyalin otomatis. Salin kode di atas secara manual.")
    }
  }

  useEffect(() => {
    if (!recoveryCode) return
    recoveryHeadingRef.current?.focus()
  }, [recoveryCode])

  useEffect(() => {
    if (!recoveryCode || confirmed) return
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [recoveryCode, confirmed])

  if (recoveryCode) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md p-9">
          <h1
            ref={recoveryHeadingRef}
            tabIndex={-1}
            className="mb-1 flex items-center gap-2 font-heading text-2xl outline-none"
          >
            <HugeiconsIcon icon={Key01Icon} aria-hidden /> Simpan Kode
          </h1>
          <p className="mb-7 text-sm text-muted-foreground">
            Akun berhasil dibuat! Kode ini <strong>hanya muncul sekali</strong> — simpan di tempat
            aman seperti catatan atau password manager.
          </p>

          <output className="mb-5 block rounded-lg border-2 border-dashed border-primary bg-muted p-5 text-center font-mono tracking-widest text-primary">
            {recoveryCode}
          </output>

          <Alert variant="destructive" className="mb-4">
            <HugeiconsIcon icon={SecurityWarningIcon} aria-hidden /> Tanpa kode ini, kamu tidak bisa
            reset password kalau lupa.
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
                <HugeiconsIcon icon={CopyLinkIcon} aria-hidden /> Salin Recovery Code
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

          <Button
            type="button"
            disabled={!confirmed}
            onClick={() => navigate({ to: "/dashboard" })}
          >
            Sudah disimpan <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
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
        <h1 className="mb-1 font-heading text-2xl">
          OpenFrame<span className="text-primary">.</span>
        </h1>
        <p className="mb-7 text-sm text-muted-foreground">
          Buat akun gratis — tanpa email, tanpa nomor telepon
        </p>

        {error && (
          <Alert variant="destructive" role="alert" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label
              htmlFor="username"
              className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Username <span className="normal-case tracking-normal">min. 3 karakter</span>
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="pilih username unik"
            />
          </div>

          <div className="mb-6">
            <Label
              htmlFor="password"
              className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Password <span className="normal-case tracking-normal">min. 6 karakter</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? (
              "Membuat akun..."
            ) : (
              <>
                Daftar Sekarang <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </Card>
    </main>
  )
}
