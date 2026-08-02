import { type PointerEvent as ReactPointerEvent, useCallback, useRef, useState } from "react"
import { IDENTITAS, panBounds, slotAt, type Transform } from "@/lib/composite"
import type { FrameSize, SlotRect } from "@/lib/geometry"

/** Zoom minimum 0.25 — foto bisa diperkecil, celah kosong wajar. */
const ZOOM_MIN = 0.25
const ZOOM_MAKS = 3

type Mode = "satu" | "perSlot"

type Params = {
  mode: Mode
  /** Mode `satu`: satu foto untuk semua slot. */
  photo: HTMLImageElement | null
  /** Mode `perSlot`: satu foto per indeks slot. */
  fotoPerSlot: Record<number, HTMLImageElement>
  slots: readonly SlotRect[]
  /** Ukuran kanvas preview dalam piksel. */
  canvas: FrameSize
  /** Dipanggil setelah tiap tulis transform, supaya preview ikut digambar. */
  redraw: () => void
}

/**
 * Transform foto tiap slot (mode `perSlot`) atau foto tunggal (mode `satu`).
 *
 * Mode `satu`: semua slot berbagi satu transform — tarikan di slot mana pun
 * menggerakkan semuanya. Mode `perSlot`: tiap slot punya transform sendiri,
 * dan foto mana pun bisa digeser langsung tanpa memilih slot lebih dulu.
 *
 * Geser dijepit keras ke batas slot (`panBounds`) — tanpa rubber-band dan
 * tanpa spring. Tidak ada animasi: pointer melepas nilai tepat di tempatnya.
 */
export function useSlotTransform({ mode, photo, fotoPerSlot, slots, canvas, redraw }: Params) {
  // Transform tinggal di ref, bukan state: menggeser tidak perlu re-render
  // React, cukup gambar ulang kanvas.
  const satu = useRef<Transform>({ ...IDENTITAS })
  const perSlot = useRef<Record<number, Transform>>({})
  /** Ukuran slot acuan tarikan terakhir. Dipakai `setScale` mode `satu`. */
  const ukuranTerakhir = useRef<FrameSize>({ width: 0, height: 0 })

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
    return mode === "satu" ? satu.current : (perSlot.current[index] ?? IDENTITAS)
  }

  function tulis(index: number, t: Transform) {
    if (mode === "satu") satu.current = t
    else perSlot.current[index] = t
  }

  /** Ukuran slot dalam piksel kanvas; mode `satu` memakai slot yang terakhir disentuh. */
  function ukuranSlot(index: number): FrameSize {
    if (mode === "satu") return ukuranTerakhir.current
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
    if (mode === "satu" && !photo) return

    const box = event.currentTarget.getBoundingClientRect()
    const titik = { x: event.clientX - box.left, y: event.clientY - box.top }
    const kena = slotAt(slots, titik, canvas)
    if (kena < 0) return
    // Mode per-slot: tanpa foto di slot itu, tidak ada yang bisa digeser.
    const img = mode === "satu" ? photo : fotoPerSlot[kena]
    if (!img) return

    const slot = slots[kena]
    if (!slot) return
    const ukuran = {
      width: (slot.width / 100) * canvas.width,
      height: (slot.height / 100) * canvas.height,
    }
    if (ukuran.width <= 0) return

    // Laju geser memakai ukuran slot yang disentuh, bukan slot lain — tanpa
    // itu isi slot berukuran lain bergerak lebih cepat atau lebih lambat
    // daripada jari.
    ukuranTerakhir.current = ukuran
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
    const img = mode === "satu" ? photo : fotoPerSlot[d.index]
    if (!img) return

    // Delta dihitung dari titik awal, bukan bertahap, supaya galat tidak
    // menumpuk sepanjang tarikan. Lalu dijepit keras ke batas slot.
    const b = panBounds(
      { width: img.naturalWidth, height: img.naturalHeight },
      d.ukuran,
      d.awal.scale,
    )
    const mentahX = d.awal.offsetX + (event.clientX - d.startX) / d.ukuran.width
    const mentahY = d.awal.offsetY + (event.clientY - d.startY) / d.ukuran.height

    tulis(d.index, {
      scale: d.awal.scale,
      offsetX: Math.min(b.x, Math.max(-b.x, mentahX)),
      offsetY: Math.min(b.y, Math.max(-b.y, mentahY)),
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
    const img = mode === "satu" ? photo : fotoPerSlot[index]
    if (!img) return
    const berikut = Math.min(ZOOM_MAKS, Math.max(ZOOM_MIN, nilai))

    // Mengecilkan zoom menyempitkan ruang gerak; tarik offset masuk lagi
    // supaya celah kosong tidak muncul di tepi slot.
    const b = panBounds(
      { width: img.naturalWidth, height: img.naturalHeight },
      ukuranSlot(index),
      berikut,
    )
    const t = baca(index)
    tulis(index, {
      scale: berikut,
      offsetX: Math.min(b.x, Math.max(-b.x, t.offsetX)),
      offsetY: Math.min(b.y, Math.max(-b.y, t.offsetY)),
    })
    setSkalaState((s) => ({ ...s, [index]: berikut }))
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
    reset,
    mulai,
    geser,
    selesai,
  }
}
