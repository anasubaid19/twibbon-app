import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { pesanError } from '@/lib/pesan-error'
import { resetPassword } from '@/server/auth'

export const Route = createFileRoute('/lupa-password')({ component: LupaPasswordPage })

const inputClass =
  'w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent'
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted'

/**
 * Pesan seragam untuk "username tidak ada" maupun "recovery code salah" —
 * lihat komentar di server/auth.ts. Ditampilkan apa adanya (BUKAN lewat
 * pesanError) karena ini bukan pesan asing pihak ketiga, melainkan pesan
 * keamanan yang sengaja ditulis identik untuk mencegah enumerasi username.
 */
const PESAN_RESET_GAGAL = 'Username atau recovery code salah'

function LupaPasswordPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [nextCode, setNextCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (newPassword !== confirm) {
      setError('Password baru dan konfirmasi tidak cocok')
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
      setCopyError('')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      setCopyError('Gagal menyalin otomatis. Salin kode di atas secara manual.')
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
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [nextCode, confirmed])

  if (nextCode) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-card border border-border bg-surface p-9">
          <h1
            ref={successHeadingRef}
            tabIndex={-1}
            className="mb-1 font-display text-2xl outline-none"
          >
            ✅ Reset Berhasil
          </h1>
          <p className="mb-7 text-sm text-muted">
            Password berhasil diperbarui. Recovery code lama sudah tidak berlaku — simpan yang baru
            ini.
          </p>

          <output className="mb-5 block rounded-base border-2 border-dashed border-accent bg-surface2 p-5 text-center font-mono tracking-widest text-accent">
            {nextCode}
          </output>

          <p className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            ⚠️ Ini recovery code barumu. Simpan sekarang sebelum menutup halaman.
          </p>

          {copyError && (
            <p
              role="alert"
              className="mb-3 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
            >
              {copyError}
            </p>
          )}

          <button
            type="button"
            onClick={copyCode}
            className="mb-3 w-full rounded-pill border border-border py-3 font-semibold transition-colors hover:bg-surface2"
          >
            {copied ? '✅ Tersalin!' : '📋 Salin Recovery Code Baru'}
          </button>

          <label className="mb-3 flex items-start gap-2 text-sm text-muted">
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
            onClick={() => navigate({ to: '/login' })}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            Lanjut ke Halaman Masuk →
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
        <h1 className="mb-1 font-display text-2xl">Reset Password</h1>
        <p className="mb-7 text-sm text-muted">
          Masukkan username dan recovery code yang kamu simpan saat mendaftar
        </p>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label className="mb-4 block">
            <span className={labelClass}>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              /* biome-ignore lint/a11y/noAutofocus: field pertama pada halaman khusus reset */
              autoFocus
              placeholder="username kamu"
              className={inputClass}
            />
          </label>

          <label className="mb-4 block">
            <span className={labelClass}>Recovery Code</span>
            <input
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              required
              placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
              className={`${inputClass} font-mono tracking-wide`}
            />
          </label>

          <label className="mb-4 block">
            <span className={labelClass}>
              Password Baru <span className="normal-case tracking-normal">min. 6 karakter</span>
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={inputClass}
            />
          </label>

          <label className="mb-6 block">
            <span className={labelClass}>Konfirmasi Password Baru</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {loading ? 'Memproses...' : 'Reset Password →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Ingat password?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  )
}
