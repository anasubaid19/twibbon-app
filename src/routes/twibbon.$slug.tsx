import { Sad01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { FacebookLogo, TelegramLogo, WhatsappLogo, XLogo } from "@phosphor-icons/react"
import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { SlotFiller } from "@/components/slot-filler/slot-filler"
import { Button, buttonVariants } from "@/components/ui/button"
import { renderComposite, type SlotFill } from "@/lib/composite"
import { pesanError } from "@/lib/pesan-error"
import { getCampaignBySlug, incrementUse, trackEvent } from "@/server/campaigns"

/**
 * PRD US-04. Divalidasi di klien karena fotonya memang tidak pernah
 * menyeberang ke server (P1).
 */
const MAKS_PER_SLOT = 5 * 1024 * 1024

export const Route = createFileRoute("/twibbon/$slug")({
  loader: async ({ params }) => {
    const campaign = await getCampaignBySlug({ data: { slug: params.slug } })
    if (!campaign) throw notFound()
    return campaign
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    // Kampanye privat yang bukan milik pembuka: jangan sebarkan apa-apa,
    // bukan data kampanye maupun OG-nya.
    if (loaderData.akses !== "ok") {
      return {
        meta: [
          { title: "Kampanye tidak tersedia · OpenFrame" },
          { name: "robots", content: "noindex" },
        ],
      }
    }
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
        // Privat = hanya pemilik. Mesin pencari tidak boleh jadi pihak yang
        // menyebarkan tautannya, jadi di-noindex terlepas dari akses.
        ...(loaderData.isPublic ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    }
  },
  notFoundComponent: () => (
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
  errorComponent: () => (
    <>
      <Navbar />
      <main className="mx-auto max-w-md p-6 text-center">
        <h1 className="mb-2 font-heading text-2xl">Terjadi kesalahan</h1>
        <p className="mb-6 text-muted-foreground">Kampanye gagal dimuat. Coba lagi nanti.</p>
        <Link to="/" search={{ q: "", hal: 1 }} className="text-primary hover:underline">
          Kembali ke beranda
        </Link>
      </main>
      <Footer />
    </>
  ),
  component: TwibbonPage,
})

type Muatan = Awaited<ReturnType<typeof getCampaignBySlug>>
type KampanyePublik = Extract<NonNullable<Muatan>, { akses: "ok" }>

function TwibbonPage() {
  const muatan = Route.useLoaderData()

  // Dispatcher ringan: hanya memakai useLoaderData, jadi cabang akses tidak
  // menggeser urutan hook. Komponen berat (HalamanPublik) punya hook-nya
  // sendiri dan baru dirender saat akses diizinkan.
  if (!muatan) return null
  if (muatan.akses !== "ok") {
    return muatan.akses === "privat-lain" ? <PrivatLain /> : <PrivatAnonim />
  }
  return <HalamanPublik campaign={muatan} />
}

/** Privat, pemilik terdaftar, tapi pembuka bukan pemiliknya. */
function PrivatLain() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md p-6 text-center">
        <HugeiconsIcon
          icon={Sad01Icon}
          aria-hidden
          className="mx-auto mb-3 mt-16 text-6xl text-muted-foreground"
        />
        <h1 className="font-heading text-2xl">Kampanye tidak dapat diakses</h1>
        <p className="mb-6 mt-2 text-muted-foreground">
          Campaign ini bersifat Private dan tidak dapat diakses. Hanya pembuatnya yang bisa
          membukanya.
        </p>
        <Link to="/" search={{ q: "", hal: 1 }} className="text-primary hover:underline">
          Kembali ke beranda
        </Link>
      </main>
      <Footer />
    </>
  )
}

/**
 * Privat, dibuat oleh pembuat yang belum login. Karena `campaigns.userId`
 * kosong, tidak ada cara mengikat kampanye ke akun setelah login — jadi kedua
 * tombol mengarah ke login, dan yang bisa "Jadikan Public" hanyalah pembuat
 * yang masuk dari konto asalnya.
 * ponytail: klaim kepemilikan di luar lingkup; cara naiknya = mekanisme
 * klaim yang mengikat kampanye anonim ke akun.
 */
function PrivatAnonim() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md p-6 text-center">
        <HugeiconsIcon
          icon={Sad01Icon}
          aria-hidden
          className="mx-auto mb-3 mt-16 text-6xl text-muted-foreground"
        />
        <h1 className="font-heading text-2xl">Campaign ini masih Private</h1>
        <p className="mb-6 mt-2 text-muted-foreground">
          Campaign ini dibuat sebagai Private oleh pembuat yang belum login. Siapa pun tidak dapat
          mengaksesnya sebelum pembuatnya login dan mengubahnya menjadi Public.
        </p>
        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          <Link to="/login" className={buttonVariants({ size: "lg" })}>
            Login
          </Link>
          <Link to="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Jadikan Public (khusus creator setelah login)
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}

function HalamanPublik({ campaign }: { campaign: KampanyePublik }) {
  const c = campaign
  /** Satu foto per indeks slot. */
  const [fotoPerSlot, setFotoPerSlot] = useState<Record<number, HTMLImageElement>>({})
  const [error, setError] = useState("")
  const [sedangUnduh, setSedangUnduh] = useState(false)
  const [tersalin, setTersalin] = useState(false)
  const [sudahUnduh, setSudahUnduh] = useState(false)

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
    trackEvent({ data: { id: c.id, type: "view" } }).catch(() => {})
  }, [c.id])

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
        frame.src = `/api/frame/${c.id}`
      })

      // Fungsi yang sama dengan preview — cuma skalanya berbeda (P3).
      const kanvas = renderComposite({
        frame,
        frameSize: { width: c.frameWidth, height: c.frameHeight },
        slots: c.slots,
        getFill: bacaIsi.current,
        scale,
      })

      const tautan = document.createElement("a")
      tautan.download = `openframe-${c.slug}-${scale}x.png`
      tautan.href = kanvas.toDataURL("image/png")
      tautan.click()

      // Dihitung setelah berkasnya benar-benar jadi, bukan saat tombol ditekan:
      // kalau rendernya gagal, hitungannya tidak ikut naik.
      await incrementUse({ data: { id: c.id } })
      await trackEvent({ data: { id: c.id, type: "download" } })
      setSudahUnduh(true)
    } catch (err) {
      setError(pesanError(err))
    } finally {
      setSedangUnduh(false)
    }
  }

  async function bagikan(metode: "whatsapp" | "facebook" | "x" | "telegram" | "copy") {
    setError("")
    const url = window.location.href
    const teks = `Buat twibbon ${c.name} di OpenFrame!`
    const buka = (u: string) => window.open(u, "_blank", "noopener")
    if (metode === "whatsapp") {
      buka(`https://wa.me/?text=${encodeURIComponent(`${teks}\n${url}`)}`)
    } else if (metode === "facebook") {
      buka(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(teks)}`,
      )
    } else if (metode === "x") {
      buka(
        `https://x.com/intent/tweet?text=${encodeURIComponent(teks)}&url=${encodeURIComponent(url)}`,
      )
    } else if (metode === "telegram") {
      buka(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(teks)}`)
    } else {
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        setError("Gagal menyalin. Salin tautan dari bilah alamat browser.")
        return
      }
      setTersalin(true)
      setTimeout(() => setTersalin(false), 2000)
    }
    await trackEvent({ data: { id: c.id, type: "share" } }).catch(() => {})
  }

  const adaFoto = Object.keys(fotoPerSlot).length > 0

  const TombolBagi = ({
    label,
    warna,
    onKlik,
    children,
  }: {
    label: string
    warna: string
    onKlik: () => void
    children: ReactNode
  }) => (
    <button
      type="button"
      aria-label={label}
      onClick={onKlik}
      className="flex size-9 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
      style={{ backgroundColor: warna }}
    >
      {children}
    </button>
  )

  const trailerUnduh = sudahUnduh && adaFoto && (
    <div className="mt-1 border-t border-border pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Bagikan
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <TombolBagi label="Bagikan ke WhatsApp" warna="#25D366" onKlik={() => bagikan("whatsapp")}>
          <WhatsappLogo weight="fill" className="size-4" aria-hidden />
        </TombolBagi>
        <TombolBagi label="Bagikan ke Facebook" warna="#1877F2" onKlik={() => bagikan("facebook")}>
          <FacebookLogo weight="fill" className="size-4" aria-hidden />
        </TombolBagi>
        <TombolBagi label="Bagikan ke X" warna="#000000" onKlik={() => bagikan("x")}>
          <XLogo weight="fill" className="size-4" aria-hidden />
        </TombolBagi>
        <TombolBagi label="Bagikan ke Telegram" warna="#229ED9" onKlik={() => bagikan("telegram")}>
          <TelegramLogo weight="fill" className="size-4" aria-hidden />
        </TombolBagi>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => bagikan("copy")}>
          {tersalin ? "Tersalin!" : "Salin tautan"}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <Navbar />
      <main
        className={`mx-auto w-full max-w-[1280px] px-6 py-10 ${adaFoto ? "pb-32 md:pb-10" : ""}`}
      >
        <h1 className="fade-up text-center font-heading text-3xl tracking-[-0.02em]">{c.name}</h1>
        {c.description && (
          <p className="fade-up mx-auto mt-2 max-w-md text-center text-muted-foreground">
            {c.description}
          </p>
        )}
        <p className="fade-up mb-8 mt-2 text-center text-sm text-muted-foreground">
          {c.slots.length} area foto · oleh{" "}
          <strong>{c.username ? `@${c.username}` : "OpenFrame"}</strong>
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
            frameSrc={`/api/frame/${c.id}`}
            frameSize={{ width: c.frameWidth, height: c.frameHeight }}
            slots={c.slots}
            fotoPerSlot={fotoPerSlot}
            onPilihFotoSlot={pilihFotoSlot}
            onGetFill={simpanPembaca}
            onUnduh={unduh}
            sedangUnduh={sedangUnduh}
            trailerUnduh={trailerUnduh}
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
