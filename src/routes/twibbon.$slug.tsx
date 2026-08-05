import { Sad01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { SlotFiller } from "@/components/slot-filler/slot-filler"
import { renderComposite, type SlotFill } from "@/lib/composite"
import { pesanError } from "@/lib/pesan-error"
import { getCampaignBySlug, incrementUse, trackEvent } from "@/server/campaigns"

/**
 * PRD US-04. Divalidasi di klien karena fotonya memang tidak pernah
 * menyeberang ke server (P1).
 */
const MAKS_PER_SLOT = 5 * 1024 * 1024

export const Route = createFileRoute("/twibbon/$slug")({
  loader: ({ params }) => getCampaignBySlug({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const ringkas = loaderData.description || "Bikin twibbonmu di OpenFrame."
    return {
      meta: [
        { title: `${loaderData.name} · OpenFrame` },
        { name: "description", content: ringkas },
        { property: "og:type", content: "website" },
        { property: "og:title", content: loaderData.name },
        { property: "og:description", content: ringkas },
        { property: "og:image", content: loaderData.ogImage },
        { property: "og:url", content: loaderData.ogUrl },
        { name: "twitter:card", content: "summary_large_image" },
        // Privat = tautan-saja. Siapa pun yang dikirimi tautannya boleh
        // membuka halaman ini, tapi mesin pencari tidak boleh jadi pihak
        // yang menyebarkan tautan itu.
        ...(loaderData.isPublic ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    }
  },
  errorComponent: () => (
    <>
      <Navbar />
      <main className="mx-auto max-w-md p-6 text-center">
        <HugeiconsIcon
          icon={Sad01Icon}
          aria-hidden
          className="mx-auto mb-3 mt-16 text-6xl text-muted-foreground"
        />
        <h1 className="mb-2 font-heading text-2xl">Kampanye tidak ditemukan</h1>
        <p className="mb-6 text-muted-foreground">
          Mungkin tautannya salah, atau kampanyenya sudah dihapus.
        </p>
        <Link to="/" search={{ q: "", hal: 1 }} className="text-primary hover:underline">
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
  /** Satu foto per indeks slot. */
  const [fotoPerSlot, setFotoPerSlot] = useState<Record<number, HTMLImageElement>>({})
  const [error, setError] = useState("")
  const [sedangUnduh, setSedangUnduh] = useState(false)
  const [tersalin, setTersalin] = useState(false)

  /*
   * Yang disimpan adalah PEMBACA isi slot, bukan salinan nilainya. Menyimpan
   * nilainya akan membekukan posisi foto pada render terakhir, dan hasil
   * unduhan bisa berbeda dari preview — persis kelas bug yang P3 hapus.
   */
  const bacaIsi = useRef<(index: number) => SlotFill | undefined>(() => undefined)
  const simpanPembaca = useCallback((getFill: (index: number) => SlotFill | undefined) => {
    bacaIsi.current = getFill
  }, [])

  // Track page view sekali saat komponen mount
  useEffect(() => {
    trackEvent({ data: { id: campaign.id, type: "view" } }).catch(() => {})
  }, [campaign.id])

  /** Memuat berkas jadi elemen gambar, dengan pemeriksaan ukuran dan jenisnya. */
  function muatGambar(berkas: File, maks: number, pakai: (img: HTMLImageElement) => void) {
    if (berkas.size > maks) {
      setError(`Ukuran foto maksimal ${Math.round(maks / 1024 / 1024)}MB`)
      return
    }
    if (!berkas.type.startsWith("image/")) {
      setError("Berkasnya harus berupa gambar")
      return
    }
    const url = URL.createObjectURL(berkas)
    const img = new Image()
    img.onload = () => pakai(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setError("Gambarnya tidak bisa dibaca. Coba berkas lain.")
    }
    img.src = url
  }

  function pilihFotoSlot(index: number, berkas: File | undefined) {
    if (!berkas) return
    setError("")
    muatGambar(berkas, MAKS_PER_SLOT, (img) => {
      setFotoPerSlot((sebelum) => ({ ...sebelum, [index]: img }))
    })
  }

  async function unduh(scale: number) {
    setSedangUnduh(true)
    setError("")
    try {
      const frame = new Image()
      frame.crossOrigin = "anonymous"
      await new Promise<void>((selesai, gagal) => {
        frame.onload = () => selesai()
        frame.onerror = () => gagal(new Error("Frame gagal dimuat"))
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

      const tautan = document.createElement("a")
      tautan.download = `openframe-${campaign.slug}-${scale}x.png`
      tautan.href = kanvas.toDataURL("image/png")
      tautan.click()

      // Dihitung setelah berkasnya benar-benar jadi, bukan saat tombol ditekan:
      // kalau rendernya gagal, hitungannya tidak ikut naik.
      await incrementUse({ data: { id: campaign.id } })
      await trackEvent({ data: { id: campaign.id, type: "download" } })
    } catch (err) {
      setError(pesanError(err))
    } finally {
      setSedangUnduh(false)
    }
  }

  async function bagikan(metode: "whatsapp" | "twitter" | "copy") {
    const url = window.location.href
    const teks = `Buat twibbon ${campaign.name} di OpenFrame!`
    if (metode === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${teks}\n${url}`)}`, "_blank")
    } else if (metode === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(teks)}&url=${encodeURIComponent(url)}`,
        "_blank",
      )
    } else {
      await navigator.clipboard.writeText(url)
      setTersalin(true)
      setTimeout(() => setTersalin(false), 2000)
    }
    await trackEvent({ data: { id: campaign.id, type: "share" } })
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-[1280px] px-6 py-10">
        <h1 className="fade-up text-center font-heading text-3xl tracking-[-0.02em]">
          {campaign.name}
        </h1>
        {campaign.description && (
          <p className="fade-up mx-auto mt-2 max-w-md text-center text-muted-foreground">
            {campaign.description}
          </p>
        )}
        <p className="fade-up mb-8 mt-2 text-center text-sm text-muted-foreground">
          {campaign.slots.length} area foto · oleh <strong>@{campaign.username}</strong>
        </p>

        {error && (
          <p
            role="alert"
            className="mx-auto mb-4 max-w-xl rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="fade-up-2">
          <SlotFiller
            frameSrc={`/api/frame/${campaign.id}`}
            frameSize={{ width: campaign.frameWidth, height: campaign.frameHeight }}
            slots={campaign.slots}
            fotoPerSlot={fotoPerSlot}
            onPilihFotoSlot={pilihFotoSlot}
            onGetFill={simpanPembaca}
            onUnduh={unduh}
            sedangUnduh={sedangUnduh}
          />

          {/* Share buttons */}
          <div className="mx-auto mt-8 flex w-full max-w-md items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => bagikan("whatsapp")}
              className="flex-1 rounded-md bg-[#25D366] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#20bd5a]"
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => bagikan("twitter")}
              className="flex-1 rounded-md bg-[#1DA1F2] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a8cd8]"
            >
              Twitter
            </button>
            <button
              type="button"
              onClick={() => bagikan("copy")}
              className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              {tersalin ? "Tersalin!" : "Salin Tautan"}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
