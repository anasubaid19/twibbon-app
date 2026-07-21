import { animate, type MotionValue, useMotionValue } from 'motion/react'
import { type PointerEvent as ReactPointerEvent, useCallback, useRef, useState } from 'react'
import { panBounds, rubberBand, type Transform } from '@/lib/composite'
import type { FrameSize } from '@/lib/geometry'

/** Aturan 24: critically damped — ini gerakan menetap, bukan lemparan. */
const PEGAS = { type: 'spring', damping: 1, bounce: 0, duration: 0.35 } as const

/** Zoom minimum 1 = tepat menutup slot. Di bawah itu celah kosong muncul. */
const ZOOM_MIN = 1
const ZOOM_MAKS = 3

type Params = {
  image: HTMLImageElement | null
  /** Ukuran slot dalam piksel preview. */
  slotSize: FrameSize
}

export function useSlotTransform({ image, slotSize }: Params) {
  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const [scale, setScaleState] = useState(1)

  const drag = useRef<{
    pointerId: number
    startX: number
    startY: number
    awal: Transform
  } | null>(null)

  const batasUntuk = useCallback(
    (zoom: number) => {
      if (!image) return { x: 0, y: 0 }
      return panBounds({ width: image.naturalWidth, height: image.naturalHeight }, slotSize, zoom)
    },
    [image, slotSize],
  )

  /** Nilai transform saat ini — dibaca renderComposite tiap kali menggambar. */
  const bacaTransform = useCallback(
    (): Transform => ({ scale, offsetX: offsetX.get(), offsetY: offsetY.get() }),
    [scale, offsetX, offsetY],
  )

  function mulai(event: ReactPointerEvent) {
    if (!image) return
    // Aturan 21: umpan balik saat pointer-down, bukan saat klik.
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      awal: bacaTransform(),
    }
  }

  function geser(event: ReactPointerEvent) {
    const d = drag.current
    if (!d || d.pointerId !== event.pointerId) return
    if (slotSize.width <= 0 || slotSize.height <= 0) return

    // Aturan 22: 1:1 dengan pointer. Delta dihitung dari titik awal, bukan
    // bertahap, supaya galat tidak menumpuk sepanjang tarikan.
    const b = batasUntuk(scale)
    const mentahX = d.awal.offsetX + (event.clientX - d.startX) / slotSize.width
    const mentahY = d.awal.offsetY + (event.clientY - d.startY) / slotSize.height

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
    const b = batasUntuk(scale)
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
    const b = batasUntuk(berikut)
    kembalikan(offsetX, b.x)
    kembalikan(offsetY, b.y)
  }

  return { offsetX, offsetY, scale, setScale, mulai, geser, selesai, reset, bacaTransform }
}

/** Memantulkan nilai kembali ke dalam batas, kalau ia memang di luar. */
function kembalikan(nilai: MotionValue<number>, batas: number) {
  kembalikanKe(nilai, Math.min(batas, Math.max(-batas, nilai.get())))
}

function kembalikanKe(nilai: MotionValue<number>, tujuan: number) {
  if (tujuan === nilai.get()) return

  // Aturan 30: yang meminta gerakan minim langsung dilompatkan ke nilai akhir.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nilai.set(tujuan)
    return
  }
  animate(nilai, tujuan, PEGAS)
}
