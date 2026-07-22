import { createFileRoute, Link, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { AreaEditor, type SlotEditor } from '@/components/area-editor/area-editor'
import { ThemeToggle } from '@/components/theme-toggle'
import { isValidSlot } from '@/lib/geometry'
import { pesanError } from '@/lib/pesan-error'
import { getCampaignForEdit, replaceFrame, updateCampaign } from '@/server/campaigns'
import { getSession } from '@/server/session'

export const Route = createFileRoute('/edit/$id')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    return { username: session.user.username }
  },
  // getCampaignForEdit sudah memfilter berdasarkan pemilik, jadi kampanye
  // orang lain sampai di sini sebagai "tidak ditemukan" — tidak ada cabang
  // otorisasi kedua yang perlu dijaga tetap sinkron (spec 9.1).
  loader: ({ params }) => getCampaignForEdit({ data: { id: params.id } }),
  errorComponent: () => (
    <main className="mx-auto max-w-md p-6 text-center">
      <h1 className="mb-2 mt-16 font-display text-2xl">Kampanye tidak ditemukan</h1>
      <p className="mb-6 text-muted">Mungkin sudah dihapus, atau bukan milik akun ini.</p>
      <Link to="/dashboard" className="text-brand hover:underline">
        Kembali ke dashboard
      </Link>
    </main>
  ),
  component: EditPage,
})

function EditPage() {
  const campaign = Route.useLoaderData()
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()

  const [slots, setSlots] = useState<SlotEditor[]>(campaign.slots)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [name, setName] = useState(campaign.name)
  const [description, setDescription] = useState(campaign.description)
  const [isPublic, setIsPublic] = useState(campaign.isPublic)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [sedangGanti, setSedangGanti] = useState(false)

  async function gantiFrame(berkas: File | undefined) {
    if (!berkas) return
    setError('')
    setSedangGanti(true)
    try {
      const form = new FormData()
      form.set('id', id)
      form.set('frame', berkas)
      await replaceFrame({ data: form })
      // Muat ulang route: dimensi frame berubah, dan validitas slot dihitung
      // terhadap dimensi itu.
      await router.invalidate()
    } catch (err) {
      setError(pesanError(err))
    } finally {
      setSedangGanti(false)
    }
  }

  const frameSize = { width: campaign.frameWidth, height: campaign.frameHeight }
  const areaValid = slots.every((slot) => isValidSlot(slot, frameSize))
  const bisaSimpan = name.trim().length >= 3 && areaValid && !saving

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await updateCampaign({
        data: {
          id,
          name,
          description,
          isPublic,
          slots: slots.map((slot) => ({ ...slot, label: slot.label ?? '' })),
        },
      })
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(pesanError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="flex items-center justify-between py-6">
        <div>
          <h1 className="font-display text-2xl">Ubah Kampanye</h1>
          {/* Slug tidak ikut berubah saat nama diubah — tautan yang sudah
              dibagikan harus tetap hidup. */}
          <p className="text-sm text-muted">/twibbon/{campaign.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/dashboard"
            className="rounded-pill border border-border px-4 py-1.5 text-sm transition-colors hover:bg-surface2"
          >
            Batal
          </Link>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1fr_20rem]">
        <section>
          <AreaEditor
            frameSrc={`/api/frame/${id}`}
            frameSize={frameSize}
            slots={slots}
            onChange={setSlots}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
          <p className="mt-3 text-sm text-muted">
            Geser kotaknya untuk memindahkan area foto, tarik pegangannya untuk mengubah ukuran.
          </p>
          <label className="mt-3 block cursor-pointer rounded-base border-2 border-dashed border-border bg-surface2 p-4 text-center text-sm transition-colors hover:border-brand">
            <span className="font-semibold">
              {sedangGanti ? 'Mengganti frame…' : '🖼 Ganti frame PNG'}
            </span>
            <span className="mt-1 block text-xs text-muted">
              Area foto tetap di posisi yang sama — koordinatnya persen, jadi ikut menyesuaikan
              ukuran frame baru
            </span>
            <input
              type="file"
              accept="image/png"
              className="sr-only"
              disabled={sedangGanti}
              onChange={(event) => gantiFrame(event.target.files?.[0])}
            />
          </label>

          {!areaValid && (
            <p className="mt-2 text-sm text-danger">
              Area foto terlalu kecil. Perbesar sampai minimal 20x20 piksel pada ukuran frame
              aslinya.
            </p>
          )}
        </section>

        <aside className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Nama kampanye
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-brand"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Deskripsi <span className="normal-case tracking-normal">opsional</span>
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-sm border-[1.5px] border-border bg-surface2 px-3.5 py-2.5 outline-none transition-colors focus:border-brand"
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="mt-0.5"
            />
            Tampilkan di galeri publik
          </label>

          <button
            type="submit"
            disabled={!bisaSimpan}
            className="w-full rounded-pill bg-brand py-3 font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </aside>
      </form>
    </main>
  )
}
