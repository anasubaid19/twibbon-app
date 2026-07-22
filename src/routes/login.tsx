import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

      <Card className="fade-up w-full max-w-md p-9">
        <h1 className="mb-1 font-heading text-2xl">
          OpenFrame<span className="text-primary">.</span>
        </h1>
        <p className="mb-7 text-sm text-muted-foreground">Masuk ke akun kamu dan mulai berkarya</p>

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
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              /* biome-ignore lint/a11y/noAutofocus: field pertama pada halaman khusus masuk */
              autoFocus
              placeholder="username kamu"
            />
          </div>

          <div className="mb-2">
            <Label
              htmlFor="password"
              className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Password
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

          <div className="mb-5 text-right">
            <Link to="/lupa-password" className="text-xs text-primary hover:underline">
              Lupa password?
            </Link>
          </div>

          <Button type="submit" size="blok" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk →'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link to="/register" className="text-primary hover:underline">
            Daftar gratis
          </Link>
        </p>
      </Card>
    </main>
  )
}
