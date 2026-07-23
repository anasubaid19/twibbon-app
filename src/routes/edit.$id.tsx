import { Image as ImageIcon } from '@phosphor-icons/react'
import { createFileRoute, Link, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { AreaEditor, type SlotEditor } from '@/components/area-editor/area-editor'
import { ThemeToggle } from '@/components/theme-toggle'
import { Alert } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
      <h1 className="mb-2 mt-16 font-heading text-2xl">Kampanye tidak ditemukan</h1>
      <p className="mb-6 text-muted-foreground">
        Mungkin sudah dihapus, atau bukan milik akun ini.
      </p>
      <Link to="/dashboard" className="text-primary hover:underline">
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
          <h1 className="font-heading text-2xl">Ubah Kampanye</h1>
          {/* Slug tidak ikut berubah saat nama diubah — tautan yang sudah
              dibagikan harus tetap hidup. */}
          <p className="text-sm text-muted-foreground">/twibbon/{campaign.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/dashboard" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Batal
          </Link>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" role="alert" className="mb-4">
          {error}
        </Alert>
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
          <p className="mt-3 text-sm text-muted-foreground">
            Geser kotaknya untuk memindahkan area foto, tarik pegangannya untuk mengubah ukuran.
          </p>
          <label className="mt-3 block cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted p-4 text-center text-sm transition-colors hover:border-primary">
            <span className="flex items-center justify-center gap-1.5 font-semibold">
              {sedangGanti ? (
                'Mengganti frame…'
              ) : (
                <>
                  <ImageIcon aria-hidden /> Ganti frame PNG
                </>
              )}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
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
            <p className="mt-2 text-sm text-destructive">
              Area foto terlalu kecil. Perbesar sampai minimal 20x20 piksel pada ukuran frame
              aslinya.
            </p>
          )}
        </section>

        <aside className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <div>
            <Label
              htmlFor="nama"
              className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Nama kampanye
            </Label>
            <Input
              id="nama"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
            />
          </div>

          <div>
            <Label
              htmlFor="deskripsi"
              className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Deskripsi <span className="normal-case tracking-normal">opsional</span>
            </Label>
            <Textarea
              id="deskripsi"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <Label className="flex items-start gap-2 text-sm font-normal text-muted-foreground">
            <Checkbox
              checked={isPublic}
              onCheckedChange={(v) => setIsPublic(v === true)}
              className="mt-0.5"
            />
            Tampilkan di galeri publik
          </Label>

          <Button type="submit" size="blok" disabled={!bisaSimpan}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </aside>
      </form>
    </main>
  )
}
