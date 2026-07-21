import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { SlotFiller } from '@/components/slot-filler/slot-filler'
import { IDENTITAS, renderComposite, type Transform } from '@/lib/composite'
import { pesanError } from '@/lib/pesan-error'
import { getCampaignBySlug, incrementUse } from '@/server/campaigns'

/**
 * PRD US-04 mode single: maksimum 15MB. Divalidasi di klien karena fotonya
 * memang tidak pernah menyeberang ke server (P1).
 */
const MAKS_FOTO = 15 * 1024 * 1024

export const Route = createFileRoute('/twibbon/$slug')({
  loader: ({ params }) => getCampaignBySlug({ data: { slug: params.slug } }),
  errorComponent: () => (
    <>
      <Navbar />
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-3 mt-16 text-5xl">😕</p>
        <h1 className="mb-2 font-display text-2xl">Kampanye tidak ditemukan</h1>
        <p className="mb-6 text-muted">Mungkin tautannya salah, atau kampanyenya sudah privat.</p>
        <Link to="/" className="text-brand hover:underline">
          Kembali ke beranda
        </Link>
      </main>
    </>
  ),
  component: TwibbonPage,
})

function TwibbonPage() {
  const campaign = Route.useLoaderData()
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [error, setError] = useState('')
  const [sedangUnduh, setSedangUnduh] = useState(false)

  /*
   * Yang disimpan adalah PEMBACA transform, bukan salinan nilainya. Menyimpan
   * nilainya akan membekukan posisi foto pada render terakhir, dan hasil
   * unduhan bisa berbeda dari preview — persis kelas bug yang P3 hapus.
   */
  const bacaTransform = useRef<() => Transform>(() => IDENTITAS)
  const simpanPembaca = useCallback((baca: () => Transform) => {
    bacaTransform.current = baca
  }, [])

  useEffect(() => {
    if (!photoUrl) return
    return () => URL.revokeObjectURL(photoUrl)
  }, [photoUrl])

  function pilihFoto(berkas: File | undefined) {
    if (!berkas) return
    setError('')

    if (berkas.size > MAKS_FOTO) {
      setError('Ukuran foto maksimal 15MB')
      return
    }
    if (!berkas.type.startsWith('image/')) {
      setError('Berkasnya harus berupa gambar')
      return
    }

    const url = URL.createObjectURL(berkas)
    const img = new Image()
    img.onload = () => {
      setPhotoUrl(url)
      setPhoto(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setError('Gambarnya tidak bisa dibaca. Coba berkas lain.')
    }
    img.src = url
  }

  async function unduh(scale: number) {
    if (!photo) return
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
        getFill: () => ({ image: photo, transform: bacaTransform.current() }),
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
      <main className="atmosfer mx-auto flex max-w-3xl flex-col items-center px-6 py-10">
        <h1 className="fade-up text-center font-display text-3xl tracking-[-0.02em]">
          {campaign.name}
        </h1>
        {campaign.description && (
          <p className="fade-up mt-2 max-w-md text-center text-muted">{campaign.description}</p>
        )}
        <p className="fade-up mb-7 mt-2 text-sm text-muted">
          {campaign.slots.length} area foto · oleh <strong>@{campaign.username}</strong>
        </p>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-sm border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <div className="fade-up-2 flex w-full flex-col items-center gap-5">
          <SlotFiller
            frameSrc={`/api/frame/${campaign.id}`}
            frameSize={{ width: campaign.frameWidth, height: campaign.frameHeight }}
            slots={campaign.slots}
            photo={photo}
            onTransform={simpanPembaca}
            onUnduh={unduh}
            sedangUnduh={sedangUnduh}
          />

          <label className="w-full max-w-md cursor-pointer rounded-base border-2 border-dashed border-border bg-surface2 p-5 text-center transition-colors hover:border-brand">
            <span className="font-semibold">{photo ? '🔄 Ganti foto' : '📸 Pilih foto kamu'}</span>
            <span className="mt-1 block text-xs text-muted">
              Maksimal 15MB · fotonya diproses di browser, tidak dikirim ke mana pun
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pilihFoto(e.target.files?.[0])}
            />
          </label>
        </div>
      </main>
    </>
  )
}
