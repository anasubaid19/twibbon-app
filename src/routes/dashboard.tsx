import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { authClient } from '@/lib/auth-client'
import { pesanError } from '@/lib/pesan-error'
import { listMyCampaigns } from '@/server/campaigns'
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
  loader: () => listMyCampaigns(),
  component: DashboardPage,
})

function DashboardPage() {
  const { username } = Route.useRouteContext()
  const campaigns = Route.useLoaderData()
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
      <header className="flex flex-wrap items-center justify-between gap-3 py-6">
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

      <Link
        to="/buat"
        className="mb-6 inline-block rounded-pill bg-accent px-6 py-2.5 font-semibold text-bg transition-transform hover:-translate-y-px"
      >
        + Bikin Kampanye
      </Link>

      {campaigns.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface p-10 text-center text-muted">
          Belum ada kampanye. Unggah frame PNG-mu, gambar area fotonya, lalu bagikan tautannya.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <Link
                to="/edit/$id"
                params={{ id: campaign.id }}
                className="block overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-accent"
              >
                <img
                  src={`/api/frame/${campaign.id}`}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full bg-surface2 object-contain"
                />
                <div className="p-4">
                  <h2 className="mb-1 truncate font-display text-base">{campaign.name}</h2>
                  <p className="flex flex-wrap gap-2 text-xs text-muted">
                    {/* Aplikasi lama menampilkan badge rasio di sini. Jumlah
                        slot lebih berguna di produk multi-slot (spec bagian 8). */}
                    <span className="rounded-pill bg-surface2 px-2 py-0.5">
                      {campaign.slotCount} area
                    </span>
                    <span className="rounded-pill bg-surface2 px-2 py-0.5">
                      {campaign.isPublic ? 'Publik' : 'Privat'}
                    </span>
                    <span className="rounded-pill bg-surface2 px-2 py-0.5">
                      {campaign.useCount}x dipakai
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
