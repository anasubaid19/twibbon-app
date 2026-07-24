import { animate, type MotionValue, useMotionValue } from "motion/react"
import { type PointerEvent as ReactPointerEvent, useCallback, useRef, useState } from "react"
import { panBounds, rubberBand, slotAt, type Transform } from "@/lib/composite"
import type { FrameSize, SlotRect } from "@/lib/geometry"

/** Aturan 24: critically damped — ini gerakan menetap, bukan lemparan. */
const PEGAS = { type: "spring", damping: 1, bounce: 0, duration: 0.35 } as const

/** Zoom minimum 0.25 — foto bisa diperkecil, celah kosong wajar. */
const ZOOM_MIN = 0.25
const ZOOM_MAKS = 3

type Params = {
  image: HTMLImageElement | null
  slots: readonly SlotRect[]
  /** Ukuran kanvas preview dalam piksel. */
  canvas: FrameSize
  /** Mode per-slot: hanya slot ini yang boleh digeser. -1 = semua slot bersamaan. */
  slotAktif: number
}

export function useSlotTransform({ image, slots, canvas, slotAktif }: Params) {
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const [scale, setScaleState] = useState(1)

  const drag = useRef<{
    pointerId: number
    startX: number
    startY: number
    awal: Transform
    ukuran: FrameSize
  } | null>(null)

  /**
   * Ukuran slot acuan tarikan terakhir. Dipakai `setScale` supaya batas geser
   * dihitung dengan slot yang sama seperti saat digeser, bukan slot lain.
   */
  const ukuranTerakhir = useRef<FrameSize>({ width: 0, height: 0 })

  const batasUntuk = useCallback(
    (zoom: number, ukuran: FrameSize) => {
      if (!image || ukuran.width <= 0) return { x: 0, y: 0 }
      return panBounds({ width: image.naturalWidth, height: image.naturalHeight }, ukuran, zoom)
    },
    [image],
  )

  /** Nilai transform saat ini — dibaca renderComposite tiap kali menggambar. */
  const bacaTransform = useCallback(
    (): Transform => ({ scale, offsetX: offsetX.get(), offsetY: offsetY.get() }),
    [scale, offsetX, offsetY],
  )

  /** Memuat posisi tersimpan milik slot lain ke motion value. */
  const muat = useCallback(
    (t: Transform) => {
      // jump() memutus kontinuitas dengan sengaja: ini berpindah slot, bukan
      // melanjutkan gerakan. Tanpa itu velocity slot sebelumnya ikut terbawa.
      offsetX.jump(t.offsetX)
      offsetY.jump(t.offsetY)
      setScaleState(t.scale)
    },
    [offsetX, offsetY],
  )

  function mulai(event: ReactPointerEvent) {
    if (!image) return

    const box = event.currentTarget.getBoundingClientRect()
    const titik = { x: event.clientX - box.left, y: event.clientY - box.top }
    const kena = slotAt(slots, titik, canvas)
    if (kena < 0) return
    // Di mode per-slot, menggeser di luar slot yang sedang diedit tidak
    // melakukan apa-apa — kalau tidak, jari di slot lain diam-diam memindahkan
    // slot yang aktif.
    if (slotAktif >= 0 && kena !== slotAktif) return

    const slot = slots[kena]
    if (!slot) return

    // Aturan 22: laju geser memakai ukuran slot YANG DISENTUH, bukan slot
    // pertama. Tanpa ini, isi slot berukuran lain bergerak lebih cepat atau
    // lebih lambat daripada jari.
    const ukuran = {
      width: (slot.width / 100) * canvas.width,
      height: (slot.height / 100) * canvas.height,
    }
    ukuranTerakhir.current = ukuran

    // Aturan 21: umpan balik saat pointer-down, bukan saat klik.
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      awal: bacaTransform(),
      ukuran,
    }
  }

  function geser(event: ReactPointerEvent) {
    const d = drag.current
    if (!d || d.pointerId !== event.pointerId) return

    // Aturan 22: delta dihitung dari titik awal, bukan bertahap, supaya galat
    // tidak menumpuk sepanjang tarikan.
    const b = batasUntuk(scale, d.ukuran)
    const mentahX = d.awal.offsetX + (event.clientX - d.startX) / d.ukuran.width
    const mentahY = d.awal.offsetY + (event.clientY - d.startY) / d.ukuran.height

    offsetX.set(rubberBand(mentahX, b.x))
    offsetY.set(rubberBand(mentahY, b.y))
  }

  function selesai(event: ReactPointerEvent) {
    const d = drag.current
    if (!d || d.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    drag.current = null

    // Aturan 25: animate() pada MotionValue mewarisi velocity nilai itu, dan
    // bisa disela tarikan berikutnya (aturan 23).
    const b = batasUntuk(scale, d.ukuran)
    kembalikan(offsetX, b.x)
    kembalikan(offsetY, b.y)
  }

  function reset() {
    kembalikanKe(offsetX, 0)
    kembalikanKe(offsetY, 0)
    setScaleState(1)
  }

  function setScale(nilai: number) {
    const berikut = Math.min(ZOOM_MAKS, Math.max(ZOOM_MIN, nilai))
    setScaleState(berikut)

    // Mengecilkan zoom menyempitkan ruang gerak; tarik offsetnya masuk lagi
    // supaya celah kosong tidak muncul di tepi slot.
    const b = batasUntuk(berikut, ukuranTerakhir.current)
    kembalikan(offsetX, b.x)
    kembalikan(offsetY, b.y)
  }

  return {
    offsetX,
    offsetY,
    scale,
    setScale,
    mulai,
    geser,
    selesai,
    reset,
    muat,
    bacaTransform,
  }
}

/** Memantulkan nilai kembali ke dalam batas, kalau ia memang di luar. */
function kembalikan(nilai: MotionValue<number>, batas: number) {
  kembalikanKe(nilai, Math.min(batas, Math.max(-batas, nilai.get())))
}

function kembalikanKe(nilai: MotionValue<number>, tujuan: number) {
  if (tujuan === nilai.get()) return

  // Aturan 30: yang meminta gerakan minim langsung dilompatkan ke nilai akhir.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nilai.set(tujuan)
    return
  }
  animate(nilai, tujuan, PEGAS)
}
