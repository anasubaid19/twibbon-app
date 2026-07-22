import { createFileRoute, Link, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { pesanError } from '@/lib/pesan-error'
import { deleteCampaign, listMyCampaigns } from '@/server/campaigns'
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
  const router = useRouter()
  const [logoutError, setLogoutError] = useState('')
  const [tersalin, setTersalin] = useState('')

  async function salin(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/twibbon/${slug}`)
      setTersalin(slug)
      setTimeout(() => setTersalin(''), 2000)
    } catch {
      // Izin clipboard bisa ditolak. Jangan diam — pengguna akan mengira
      // tautannya sudah tersalin padahal tidak.
      setLogoutError('Gagal menyalin. Buka halaman kampanyenya lalu salin dari bilah alamat.')
    }
  }

  async function hapus(id: string, nama: string) {
    // ponytail: confirm() bawaan, sama seperti hapus area di Fase 2 delta.
    if (!confirm(`Hapus kampanye "${nama}"? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      await deleteCampaign({ data: { id } })
      await router.invalidate()
    } catch (err) {
      setLogoutError(pesanError(err))
    }
  }

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
        <h1 className="font-heading text-2xl">Kampanye Saya</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="rounded-lg border border-border bg-muted px-3 py-1 text-sm text-muted-foreground">
            👤 {username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-border px-4 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            Keluar
          </button>
        </div>
      </header>

      {logoutError && (
        <p
          role="alert"
          className="mb-4 rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {logoutError}
        </p>
      )}

      <Link
        to="/buat"
        className="mb-6 inline-block rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-transform hover:-translate-y-px"
      >
        + Bikin Kampanye
      </Link>

      {campaigns.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          Belum ada kampanye. Unggah frame PNG-mu, gambar area fotonya, lalu bagikan tautannya.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              {/* Tombol sengaja DI LUAR <Link> pembungkus: <a> bersarang di
                  dalam <a> bukan HTML yang sah, dan perilaku kliknya jadi tak
                  terduga. */}
              <Card className="overflow-hidden transition-all hover:-translate-y-[3px] hover:border-primary">
                <Link to="/edit/$id" params={{ id: campaign.id }} className="block">
                  <img
                    src={`/api/frame/${campaign.id}`}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full bg-muted object-contain"
                  />
                  <div className="px-4 pt-4">
                    <h2 className="mb-1.5 truncate font-heading text-base">{campaign.name}</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {/* Aplikasi lama menampilkan badge rasio di sini. Jumlah
                          slot lebih berguna di produk multi-slot (spec bagian 8). */}
                      <Badge variant="netral">{campaign.slotCount} area</Badge>
                      <Badge variant={campaign.isPublic ? 'publik' : 'privat'}>
                        {campaign.isPublic ? 'Publik' : 'Privat'}
                      </Badge>
                      <Badge variant="netral">{campaign.useCount}x dipakai</Badge>
                    </div>
                  </div>
                </Link>

                <div className="flex flex-wrap gap-1.5 p-4">
                  <Link
                    to="/twibbon/$slug"
                    params={{ slug: campaign.slug }}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Lihat
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => salin(campaign.slug)}>
                    {tersalin === campaign.slug ? 'Tersalin!' : 'Salin tautan'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => hapus(campaign.id, campaign.name)}
                  >
                    Hapus
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
