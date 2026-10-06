import { type PointerEvent as ReactPointerEvent, useCallback, useRef, useState } from "react"
import { IDENTITAS, slotAt, type Transform } from "@/lib/composite"
import type { FrameSize, SlotRect } from "@/lib/geometry"

/** Zoom minimum 0.25 — foto boleh diperkecil di bawah cover, celah kosong wajar. */
const ZOOM_MIN = 0.25
const ZOOM_MAKS = 3
/**
 * Batas longgar geser bebas, sebagai pecahan ukuran slot. Foto boleh keluar
 * jauh dari slot (meniru Twibbonize), tapi tidak tak terhingga supaya tidak
 * "hilang" dan masih bisa ditarik kembali atau di-reset.
 */
const BATAS_BEBAS = 3
const KEYBOARD_NUDGE = 0.01
const PUTAR: readonly (0 | 90 | 180 | 270)[] = [0, 90, 180, 270]

type Params = {
  /** Satu foto per indeks slot. */
  fotoPerSlot: Record<number, HTMLImageElement>
  slots: readonly SlotRect[]
  /** Ukuran kanvas preview dalam piksel. */
  canvas: FrameSize
  /** Dipanggil setelah tiap tulis transform, supaya preview ikut digambar. */
  redraw: () => void
}

/**
 * Transform foto tiap slot.
 *
 * Tiap slot punya transform sendiri. Mode bebas (meniru Twibbonize): foto
 * boleh digeser melewati tepi slot sampai keluar jauh, dan boleh diperkecil
 * di bawah cover. Satu-satunya penjaga adalah `BATAS_BEBAS` supaya foto
 * tidak hilang tak terlacak. Tidak ada animasi: pointer melepas nilai tepat
 * di tempatnya.
 */
export function useSlotTransform({ fotoPerSlot, slots, canvas, redraw }: Params) {
  // Transform tinggal di ref, bukan state: menggeser tidak perlu re-render
  // React, cukup gambar ulang kanvas.
  const perSlot = useRef<Record<number, Transform>>({})

  // Skala disimpan dobel sebagai state supaya slider zoom ikut re-render.
  const [skala, setSkalaState] = useState<Record<number, number>>({})

  const redrawRef = useRef(redraw)
  redrawRef.current = redraw

  const drag = useRef<{
    pointerId: number
    index: number
    startX: number
    startY: number
    awal: Transform
    ukuran: FrameSize
  } | null>(null)

  function baca(index: number): Transform {
    return perSlot.current[index] ?? IDENTITAS
  }

  function tulis(index: number, t: Transform) {
    perSlot.current[index] = t
  }

  /** Ukuran slot dalam piksel kanvas. */
  function ukuranSlot(index: number): FrameSize {
    const slot = slots[index]
    if (!slot) return { width: 0, height: 0 }
    return {
      width: (slot.width / 100) * canvas.width,
      height: (slot.height / 100) * canvas.height,
    }
  }

  const scaleOf = useCallback((index: number) => skala[index] ?? 1, [skala])

  const bacaTransform = (index: number): Transform => baca(index)

  function mulai(event: ReactPointerEvent) {
    const box = event.currentTarget.getBoundingClientRect()
    const titik = { x: event.clientX - box.left, y: event.clientY - box.top }
    // Single-photo: tarikan dari mana saja di kanvas menggeser foto itu —
    // tidak wajib tepat kena slot (meniru Twibbonize).
    const kena = slots.length === 1 ? 0 : slotAt(slots, titik, canvas)
    if (kena < 0) return
    // Tanpa foto di slot itu, tidak ada yang bisa digeser.
    const img = fotoPerSlot[kena]
    if (!img) return

    const slot = slots[kena]
    if (!slot) return
    const ukuran = {
      width: (slot.width / 100) * canvas.width,
      height: (slot.height / 100) * canvas.height,
    }
    if (ukuran.width <= 0) return

    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      index: kena,
      startX: event.clientX,
      startY: event.clientY,
      awal: baca(kena),
      ukuran,
    }
  }

  function geser(event: ReactPointerEvent) {
    const d = drag.current
    if (!d || d.pointerId !== event.pointerId) return
    const img = fotoPerSlot[d.index]
    if (!img) return

    // Delta dihitung dari titik awal, bukan bertahap, supaya galat tidak
    // menumpuk sepanjang tarikan. Mode bebas: hanya dijaga batas longgar.
    const mentahX = d.awal.offsetX + (event.clientX - d.startX) / d.ukuran.width
    const mentahY = d.awal.offsetY + (event.clientY - d.startY) / d.ukuran.height

    tulis(d.index, {
      ...d.awal,
      offsetX: Math.min(BATAS_BEBAS, Math.max(-BATAS_BEBAS, mentahX)),
      offsetY: Math.min(BATAS_BEBAS, Math.max(-BATAS_BEBAS, mentahY)),
    })
    redrawRef.current()
  }

  function selesai(event: ReactPointerEvent) {
    const d = drag.current
    if (!d || d.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    drag.current = null
  }

  function setScale(index: number, nilai: number) {
    const img = fotoPerSlot[index]
    if (!img) return
    const berikut = Math.min(ZOOM_MAKS, Math.max(ZOOM_MIN, nilai))
    const t = baca(index)

    // Mode bebas: offset dibiarkan apa adanya. Mengecilkan zoom tidak
    // menarik foto balik ke tengah, dan celah kosong memang wajar.
    tulis(index, { ...t, scale: berikut })
    setSkalaState((s) => ({ ...s, [index]: berikut }))
    redrawRef.current()
  }

  function nudge(index: number, dx: number, dy: number) {
    const img = fotoPerSlot[index]
    const ukuran = ukuranSlot(index)
    if (!img || ukuran.width <= 0 || ukuran.height <= 0) return

    const t = baca(index)
    tulis(index, {
      ...t,
      offsetX: Math.min(BATAS_BEBAS, Math.max(-BATAS_BEBAS, t.offsetX + dx * KEYBOARD_NUDGE)),
      offsetY: Math.min(BATAS_BEBAS, Math.max(-BATAS_BEBAS, t.offsetY + dy * KEYBOARD_NUDGE)),
    })
    redrawRef.current()
  }

  /** Memutar foto slot ke kiri/kanan sebesar 90°; offset dibiarkan (mode bebas). */
  function setRotate(index: number, delta: -90 | 90) {
    const img = fotoPerSlot[index]
    if (!img) return
    const t = baca(index)
    const lama = PUTAR.indexOf((t.rotate ?? 0) as (typeof PUTAR)[number])
    const derajat = PUTAR[(lama + (delta > 0 ? 1 : PUTAR.length - 1)) % PUTAR.length]
    tulis(index, { ...t, rotate: derajat })
    redrawRef.current()
  }

  /** Membalik foto slot secara horizontal/vertikal. Pencerminan tidak
   *  mengubah batas geser, jadi offset cukup dibiarkan. */
  function setFlipH(index: number) {
    const t = baca(index)
    tulis(index, { ...t, flipH: !(t.flipH ?? false) })
    redrawRef.current()
  }

  function setFlipV(index: number) {
    const t = baca(index)
    tulis(index, { ...t, flipV: !(t.flipV ?? false) })
    redrawRef.current()
  }

  function reset(index: number) {
    tulis(index, { ...IDENTITAS })
    setSkalaState((s) => ({ ...s, [index]: 1 }))
    redrawRef.current()
  }

  return {
    bacaTransform,
    scaleOf,
    setScale,
    nudge,
    setRotate,
    setFlipH,
    setFlipV,
    reset,
    mulai,
    geser,
    selesai,
  }
}
