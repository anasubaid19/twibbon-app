import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AreaEditor, type SlotEditor } from '@/components/area-editor/area-editor'
import { ThemeToggle } from '@/components/theme-toggle'
import { type FrameSize, isValidSlot, type SlotRect } from '@/lib/geometry'
import { pesanError } from '@/lib/pesan-error'
import { slugify } from '@/lib/slug'
import { createCampaign } from '@/server/campaigns'
import { getSession } from '@/server/session'

/** Cermin dari MAX_FRAME_BYTES di server — di sini hanya supaya pesannya cepat muncul. */
const MAX_BYTES = 10 * 1024 * 1024

/** Area awal: kotak di tengah frame, cukup besar untuk langsung terlihat. */
const SLOT_AWAL: SlotRect = { x: 20, y: 20, width: 60, height: 60 }

export const Route = createFileRoute('/buat')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    return { username: session.user.username }
  },
  component: BuatPage,
})

function BuatPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [frameSrc, setFrameSrc] = useState('')
  const [frameSize, setFrameSize] = useState<FrameSize>({ width: 0, height: 0 })
  const [slots, setSlots] = useState<SlotEditor[]>([SLOT_AWAL])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  // Selama creator belum menyentuh kolom link, slug mengikuti nama. Begitu ia
  // mengetiknya sendiri, kaitan itu putus dan nama tidak lagi menimpanya.
  const [slugDiedit, setSlugDiedit] = useState(false)
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  function ubahNama(nilai: string) {
    setName(nilai)
    if (!slugDiedit) setSlug(slugify(nilai))
  }

  function ubahSlug(nilai: string) {
    setSlugDiedit(true)
    // Sama seperti yang diterima server: huruf kecil, hanya a-z 0-9 dan tanda
    // hubung. Dibersihkan saat diketik supaya preview-nya jujur.
    setSlug(nilai.toLowerCase().replace(/[^a-z0-9-]/g, ''))
  }
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Object URL memegang berkasnya di memori sampai dicabut. Tanpa ini, memilih
  // beberapa frame berturut-turut menahan semuanya sekaligus.
  useEffect(() => {
    if (!frameSrc) return
    return () => URL.revokeObjectURL(frameSrc)
  }, [frameSrc])

  function handleFile(chosen: File | undefined) {
    if (!chosen) return
    setError('')

    if (chosen.size > MAX_BYTES) {
      setError('Ukuran frame maksimal 10MB')
      return
    }
    if (chosen.type !== 'image/png') {
      // Pemeriksaan cepat supaya pengguna tidak menunggu unggahan sia-sia.
      // Penentu sesungguhnya tetap Sharp di server (spec 9.2).
      setError('Frame harus berkas PNG')
      return
    }

    const url = URL.createObjectURL(chosen)
    const probe = new Image()
    probe.onload = () => {
      setFrameSize({ width: probe.naturalWidth, height: probe.naturalHeight })
      setFrameSrc(url)
      setFile(chosen)
      setSlots([SLOT_AWAL])
    }
    probe.onerror = () => {
      URL.revokeObjectURL(url)
      setError('Frame harus berkas PNG yang valid')
    }
    probe.src = url
  }

  const areaValid = slots.every((slot) => isValidSlot(slot, frameSize))
  const bisaSimpan = Boolean(file) && name.trim().length >= 3 && areaValid && !saving

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!file) return

    setError('')
    setSaving(true)
    try {
      const form = new FormData()
      form.set('frame', file)
      form.set('name', name)
      form.set('slug', slug)
      form.set('description', description)
      form.set('isPublic', String(isPublic))
      form.set('slots', JSON.stringify(slots))

      await createCampaign({ data: form })
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
        <h1 className="font-heading text-2xl">Bikin Kampanye</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/dashboard"
            className="rounded-lg border border-border px-4 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            Batal
          </Link>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1fr_20rem]">
        <section>
          {frameSrc ? (
            <>
              <AreaEditor
                frameSrc={frameSrc}
                frameSize={frameSize}
                slots={slots}
                onChange={setSlots}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Geser kotaknya untuk memindahkan area foto, tarik pegangannya untuk mengubah ukuran.
                Bisa juga pakai panah keyboard setelah kotaknya dipilih.
              </p>
              {!areaValid && (
                <p className="mt-2 text-sm text-destructive">
                  Area foto terlalu kecil. Perbesar sampai minimal 20x20 piksel pada ukuran frame
                  aslinya.
                </p>
              )}
            </>
          ) : (
            <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted p-10 text-center transition-colors hover:border-primary">
              <span className="font-heading text-lg">Pilih frame PNG</span>
              <span className="text-sm text-muted-foreground">
                Maksimal 10MB, dengan latar transparan
              </span>
              <input
                type="file"
                accept="image/png"
                className="sr-only"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>
          )}
        </section>

        <aside className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nama kampanye
            </span>
            <input
              value={name}
              onChange={(event) => ubahNama(event.target.value)}
              required
              maxLength={80}
              placeholder="HUT RI 80"
              className="w-full rounded-sm border-[1.5px] border-border bg-muted px-3.5 py-2.5 outline-none transition-colors focus:border-primary"
            />
          </label>

          <div className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Link kampanye <span className="normal-case tracking-normal">opsional</span>
            </span>
            <div className="flex items-center overflow-hidden rounded-sm border-[1.5px] border-border bg-muted transition-colors focus-within:border-primary">
              <span className="whitespace-nowrap border-r border-border px-3 py-2.5 text-sm text-muted-foreground">
                /twibbon/
              </span>
              <input
                value={slug}
                onChange={(event) => ubahSlug(event.target.value)}
                maxLength={60}
                placeholder="nama-kampanye-kamu"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 outline-none"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {slug ? (
                <>
                  Tautannya: <span className="text-primary">/twibbon/{slug}</span>
                </>
              ) : (
                'Kosongkan untuk dibuatkan otomatis dari nama.'
              )}
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Deskripsi <span className="normal-case tracking-normal">opsional</span>
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ceritakan sedikit soal kampanye ini"
              className="w-full rounded-sm border-[1.5px] border-border bg-muted px-3.5 py-2.5 outline-none transition-colors focus:border-primary"
            />
          </label>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
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
            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {saving ? 'Menyimpan...' : 'Simpan Kampanye'}
          </button>
        </aside>
      </form>
    </main>
  )
}
