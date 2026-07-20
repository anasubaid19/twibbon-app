import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/theme-toggle'
import { authClient } from '@/lib/auth-client'
import { getSession } from '@/server/session'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    return { session }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { session } = Route.useRouteContext()
  const navigate = useNavigate()

  async function handleLogout() {
    await authClient.signOut()
    navigate({ to: '/login' })
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex items-center justify-between py-6">
        <h1 className="font-display text-2xl">Kampanye Saya</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="rounded-pill border border-border bg-surface2 px-3 py-1 text-sm text-muted">
            👤 {session.user.username}
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

      <p className="text-muted">Daftar kampanye muncul di sini pada Fase 2.</p>
    </main>
  )
}
