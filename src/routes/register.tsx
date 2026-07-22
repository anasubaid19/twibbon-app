import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { pesanError } from '@/lib/pesan-error'
import { registerUser } from '@/server/auth'

export const Route = createFileRoute('/register')({ component: RegisterPage })

function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const recoveryHeadingRef = useRef<HTMLHeadingElement>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
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
      setCopyError('')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      setCopyError('Gagal menyalin otomatis. Salin kode di atas secara manual.')
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
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [recoveryCode, confirmed])

  if (recoveryCode) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-9">
          <h1
            ref={recoveryHeadingRef}
            tabIndex={-1}
            className="mb-1 font-heading text-2xl outline-none"
          >
            🔑 Simpan Kode
          </h1>
          <p className="mb-7 text-sm text-muted-foreground">
            Akun berhasil dibuat! Kode ini <strong>hanya muncul sekali</strong> — simpan di tempat
            aman seperti catatan atau password manager.
          </p>

          <output className="mb-5 block rounded-lg border-2 border-dashed border-primary bg-muted p-5 text-center font-mono tracking-widest text-primary">
            {recoveryCode}
          </output>

          <p className="mb-4 rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            ⚠️ Tanpa kode ini, kamu tidak bisa reset password kalau lupa.
          </p>

          {copyError && (
            <p
              role="alert"
              className="mb-3 rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {copyError}
            </p>
          )}

          <button
            type="button"
            onClick={copyCode}
            className="mb-3 w-full rounded-lg border border-border py-3 font-semibold transition-colors hover:bg-muted"
          >
            {copied ? '✅ Tersalin!' : '📋 Salin Recovery Code'}
          </button>

          <label className="mb-3 flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            Saya sudah menyimpan recovery code ini di tempat aman
          </label>

          <button
            type="button"
            disabled={!confirmed}
            onClick={() => navigate({ to: '/dashboard' })}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            Sudah disimpan → Masuk Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="fixed right-5 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-xl border border-border bg-card p-9">
        <h1 className="mb-1 font-heading text-2xl">
          OpenFrame<span className="text-primary">.</span>
        </h1>
        <p className="mb-7 text-sm text-muted-foreground">
          Buat akun gratis — tanpa email, tanpa nomor telepon
        </p>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Username <span className="normal-case tracking-normal">min. 3 karakter</span>
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              /* biome-ignore lint/a11y/noAutofocus: field pertama pada halaman khusus pendaftaran */
              autoFocus
              placeholder="pilih username unik"
              className="w-full rounded-sm border-[1.5px] border-border bg-muted px-3.5 py-2.5 outline-none transition-colors focus:border-primary"
            />
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password <span className="normal-case tracking-normal">min. 6 karakter</span>
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-sm border-[1.5px] border-border bg-muted px-3.5 py-2.5 outline-none transition-colors focus:border-primary"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {loading ? 'Membuat akun...' : 'Daftar Sekarang →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  )
}
