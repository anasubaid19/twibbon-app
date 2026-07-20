import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { authClient } from '@/lib/auth-client'
import { pesanError } from '@/lib/pesan-error'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: authError } = await authClient.signIn.username({ username, password })
      if (authError) {
        // Pesan seragam: jangan bocorkan username mana yang terdaftar.
        setError('Username atau password salah')
        return
      }
      navigate({ to: '/dashboard' })
    } catch (err) {
      // authClient MELEMPAR saat jaringan putus — @better-fetch/fetch tidak
      // membungkus fetch() dengan try/catch. Tanpa blok ini tombolnya
      // terkunci selamanya di "Memproses..." tanpa pesan apa pun, dan
      // formnya tidak bisa dipakai sampai halaman dimuat ulang.
      setError(pesanError(err))
    } finally {
      setLoading(false)
    }
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
        <p className="mb-7 text-sm text-muted">Masuk ke akun kamu dan mulai berkarya</p>

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
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Username
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              /* biome-ignore lint/a11y/noAutofocus: field pertama pada halaman khusus masuk */
              autoFocus
              placeholder="username kamu"
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="mb-2 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Password
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

          <div className="mb-5 text-right">
            <Link to="/lupa-password" className="text-xs text-accent hover:underline">
              Lupa password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pill bg-accent py-3 font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {loading ? 'Memproses...' : 'Masuk →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Belum punya akun?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Daftar gratis
          </Link>
        </p>
      </div>
    </main>
  )
}
