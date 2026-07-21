import { type PointerEvent as ReactPointerEvent, useRef } from 'react'
import {
  applyDrag,
  type DragMode,
  deltaToPercent,
  type FrameSize,
  type SlotRect,
} from '@/lib/geometry'

type Params = {
  slots: readonly SlotRect[]
  /** Ukuran gambar frame seperti yang dirender di layar, dalam piksel CSS. */
  display: FrameSize
  onChange: (slots: SlotRect[]) => void
}

type DragState = {
  index: number
  mode: DragMode
  pointerId: number
  startX: number
  startY: number
  /** Kotak saat tarikan dimulai. Delta selalu dihitung dari sini, bukan bertahap. */
  start: SlotRect
}

export function useDragResize({ slots, display, onChange }: Params) {
  // Ref, bukan state: tarikan yang sedang berjalan tidak perlu memicu render
  // sendiri — render dipicu oleh onChange yang mengubah slot.
  const dragRef = useRef<DragState | null>(null)

  function replace(index: number, next: SlotRect) {
    onChange(slots.map((slot, i) => (i === index ? next : slot)))
  }

  function begin(index: number, mode: DragMode, event: ReactPointerEvent) {
    const slot = slots[index]
    if (!slot) return

    event.preventDefault()
    event.stopPropagation()
    // Pointer capture membuat pointermove tetap terkirim ke elemen ini
    // walaupun kursor sudah keluar dari kotak — tanpa itu tarikan cepat
    // "lepas" di tengah jalan.
    event.currentTarget.setPointerCapture(event.pointerId)

    dragRef.current = {
      index,
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      start: slot,
    }
  }

  function move(event: ReactPointerEvent) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    // Selalu dari posisi awal, bukan dari frame sebelumnya. Akumulasi delta
    // per-frame akan menumpuk galat pembulatan sepanjang tarikan.
    const delta = deltaToPercent(event.clientX - drag.startX, event.clientY - drag.startY, display)
    replace(drag.index, applyDrag(drag.start, drag.mode, delta.dx, delta.dy))
  }

  function end(event: ReactPointerEvent) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
  }

  /** Jalur keyboard: satu langkah papan ketik setara satu tarikan kecil. */
  function nudge(index: number, mode: DragMode, dx: number, dy: number) {
    const slot = slots[index]
    if (!slot) return
    replace(index, applyDrag(slot, mode, dx, dy))
  }

  return { begin, move, end, nudge }
}
