import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await registerUser({ data: { username, password } })
      setRecoveryCode(result.recoveryCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(recoveryCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (recoveryCode) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-card border border-border bg-surface p-9">
          <h1 className="mb-1 font-display text-2xl">🔑 Simpan Kode</h1>
          <p className="mb-7 text-sm text-muted">
            Akun berhasil dibuat! Kode ini <strong>hanya muncul sekali</strong> — simpan di tempat
            aman seperti catatan atau password manager.
          </p>

          <output className="mb-5 block rounded-base border-2 border-dashed border-accent bg-surface2 p-5 text-center font-mono tracking-widest text-accent">
            {recoveryCode}
          </output>

          <p className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            ⚠️ Tanpa kode ini, kamu tidak bisa reset password kalau lupa.
          </p>

          <button
            type="button"
            onClick={copyCode}
            className="mb-3 w-full rounded-pill border border-border py-3 font-semibold transition-colors hover:bg-surface2"
          >
            {copied ? '✅ Tersalin!' : '📋 Salin Recovery Code'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/dashboard' })}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px"
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

      <div className="w-full max-w-md rounded-card border border-border bg-surface p-9">
        <h1 className="mb-1 font-display text-2xl">
          OpenFrame<span className="text-accent">.</span>
        </h1>
        <p className="mb-7 text-sm text-muted">
          Buat akun gratis — tanpa email, tanpa nomor telepon
        </p>

        {error && (
          <p className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Username <span className="normal-case tracking-normal">min. 3 karakter</span>
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              // biome-ignore lint/a11y/noAutofocus: field pertama pada halaman khusus pendaftaran
              autoFocus
              placeholder="pilih username unik"
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Password <span className="normal-case tracking-normal">min. 6 karakter</span>
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {loading ? 'Membuat akun...' : 'Daftar Sekarang →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  )
}
