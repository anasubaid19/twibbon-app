import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { authClient } from '@/lib/auth-client'
import { pesanError } from '@/lib/pesan-error'
import { getSession } from '@/server/session'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    // Kembalikan HANYA yang dipakai. TanStack Start men-serialisasi apa pun
    // yang dikembalikan beforeLoad ke payload hidrasi, tak peduli komponennya
    // memakainya atau tidak. Mengembalikan `session` utuh berarti mengirim
    // email sintetis <username>@openframe.local ke sumber halaman, yang
    // membocorkan pola internal yang pengguna tidak boleh tahu ada.
    return { username: session.user.username }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { username } = Route.useRouteContext()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    setLogoutError('')
    try {
      await authClient.signOut()
      navigate({ to: '/login' })
    } catch (err) {
      // Sama seperti signIn, signOut bisa MELEMPAR saat jaringan putus —
      // tanpa blok ini tombol "Keluar" tidak melakukan apa-apa yang terlihat.
      setLogoutError(pesanError(err))
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex items-center justify-between py-6">
        <h1 className="font-display text-2xl">Kampanye Saya</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="rounded-pill border border-border bg-surface2 px-3 py-1 text-sm text-muted">
            👤 {username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-pill border border-border px-4 py-1.5 text-sm transition-colors hover:bg-surface2"
          >
            Keluar
          </button>
        </div>
      </header>

      {logoutError && (
        <p
          role="alert"
          className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
        >
          {logoutError}
        </p>
      )}

      <p className="text-muted">Daftar kampanye muncul di sini pada Fase 2.</p>
    </main>
  )
}
