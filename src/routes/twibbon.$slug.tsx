import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Footer } from '@/components/footer'
import { Navbar } from '@/components/navbar'
import { type ModeIsi, SlotFiller } from '@/components/slot-filler/slot-filler'
import { renderComposite, type SlotFill } from '@/lib/composite'
import { pesanError } from '@/lib/pesan-error'
import { getCampaignBySlug, incrementUse } from '@/server/campaigns'

/**
 * PRD US-04. Divalidasi di klien karena fotonya memang tidak pernah
 * menyeberang ke server (P1).
 */
const MAKS_SATU = 15 * 1024 * 1024
const MAKS_PER_SLOT = 5 * 1024 * 1024

export const Route = createFileRoute('/twibbon/$slug')({
  loader: ({ params }) => getCampaignBySlug({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const ringkas = loaderData.description || 'Bikin twibbonmu di OpenFrame.'
    return {
      meta: [
        { title: `${loaderData.name} · OpenFrame` },
        { name: 'description', content: ringkas },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: loaderData.name },
        { property: 'og:description', content: ringkas },
        { property: 'og:image', content: loaderData.ogImage },
        { property: 'og:url', content: loaderData.ogUrl },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    }
  },
  errorComponent: () => (
    <>
      <Navbar />
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-3 mt-16 text-5xl">😕</p>
        <h1 className="mb-2 font-heading text-2xl">Kampanye tidak ditemukan</h1>
        <p className="mb-6 text-muted-foreground">
          Mungkin tautannya salah, atau kampanyenya sudah privat.
        </p>
        <Link to="/" search={{ q: '', hal: 1 }} className="text-primary hover:underline">
          Kembali ke beranda
        </Link>
      </main>
      <Footer />
    </>
  ),
  component: TwibbonPage,
})

function TwibbonPage() {
  const campaign = Route.useLoaderData()
  const [mode, setMode] = useState<ModeIsi>('satu')
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  /** Mode perSlot: satu foto per indeks slot. */
  const [fotoPerSlot, setFotoPerSlot] = useState<Record<number, HTMLImageElement>>({})
  const [error, setError] = useState('')
  const [sedangUnduh, setSedangUnduh] = useState(false)

  /*
   * Yang disimpan adalah PEMBACA isi slot, bukan salinan nilainya. Menyimpan
   * nilainya akan membekukan posisi foto pada render terakhir, dan hasil
   * unduhan bisa berbeda dari preview — persis kelas bug yang P3 hapus.
   */
  const bacaIsi = useRef<(index: number) => SlotFill | undefined>(() => undefined)
  const simpanPembaca = useCallback((getFill: (index: number) => SlotFill | undefined) => {
    bacaIsi.current = getFill
  }, [])

  /** Memuat berkas jadi elemen gambar, dengan pemeriksaan ukuran dan jenisnya. */
  function muatGambar(berkas: File, maks: number, pakai: (img: HTMLImageElement) => void) {
    if (berkas.size > maks) {
      setError(`Ukuran foto maksimal ${Math.round(maks / 1024 / 1024)}MB`)
      return
    }
    if (!berkas.type.startsWith('image/')) {
      setError('Berkasnya harus berupa gambar')
      return
    }
    const url = URL.createObjectURL(berkas)
    const img = new Image()
    img.onload = () => pakai(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setError('Gambarnya tidak bisa dibaca. Coba berkas lain.')
    }
    img.src = url
  }

  useEffect(() => {
    if (!photoUrl) return
    return () => URL.revokeObjectURL(photoUrl)
  }, [photoUrl])

  function pilihFoto(berkas: File | undefined) {
    if (!berkas) return
    setError('')
    muatGambar(berkas, MAKS_SATU, (img) => {
      setPhotoUrl(img.src)
      setPhoto(img)
    })
  }

  function pilihFotoSlot(index: number, berkas: File | undefined) {
    if (!berkas) return
    setError('')
    muatGambar(berkas, MAKS_PER_SLOT, (img) => {
      setFotoPerSlot((sebelum) => ({ ...sebelum, [index]: img }))
    })
  }

  async function unduh(scale: number) {
    setSedangUnduh(true)
    setError('')
    try {
      const frame = new Image()
      frame.crossOrigin = 'anonymous'
      await new Promise<void>((selesai, gagal) => {
        frame.onload = () => selesai()
        frame.onerror = () => gagal(new Error('Frame gagal dimuat'))
        frame.src = `/api/frame/${campaign.id}`
      })

      // Fungsi yang sama dengan preview — cuma skalanya berbeda (P3).
      const kanvas = renderComposite({
        frame,
        frameSize: { width: campaign.frameWidth, height: campaign.frameHeight },
        slots: campaign.slots,
        getFill: bacaIsi.current,
        scale,
      })

      const tautan = document.createElement('a')
      tautan.download = `openframe-${campaign.slug}-${scale}x.png`
      tautan.href = kanvas.toDataURL('image/png')
      tautan.click()

      // Dihitung setelah berkasnya benar-benar jadi, bukan saat tombol ditekan:
      // kalau rendernya gagal, hitungannya tidak ikut naik.
      await incrementUse({ data: { id: campaign.id } })
    } catch (err) {
      setError(pesanError(err))
    } finally {
      setSedangUnduh(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-10">
        <h1 className="fade-up text-center font-heading text-3xl tracking-[-0.02em]">
          {campaign.name}
        </h1>
        {campaign.description && (
          <p className="fade-up mt-2 max-w-md text-center text-muted-foreground">
            {campaign.description}
          </p>
        )}
        <p className="fade-up mb-7 mt-2 text-sm text-muted-foreground">
          {campaign.slots.length} area foto · oleh <strong>@{campaign.username}</strong>
        </p>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="fade-up-2 flex w-full flex-col items-center gap-5">
          <SlotFiller
            frameSrc={`/api/frame/${campaign.id}`}
            frameSize={{ width: campaign.frameWidth, height: campaign.frameHeight }}
            slots={campaign.slots}
            mode={mode}
            onMode={setMode}
            photo={photo}
            fotoPerSlot={fotoPerSlot}
            onPilihFotoSlot={pilihFotoSlot}
            onGetFill={simpanPembaca}
            onUnduh={unduh}
            sedangUnduh={sedangUnduh}
          />

          {mode === 'satu' && (
            <label className="w-full max-w-md cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted p-5 text-center transition-colors hover:border-primary">
              <span className="font-semibold">
                {photo ? '🔄 Ganti foto' : '📸 Pilih foto kamu'}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Maksimal 15MB · fotonya diproses di browser, tidak dikirim ke mana pun
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => pilihFoto(e.target.files?.[0])}
              />
            </label>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
