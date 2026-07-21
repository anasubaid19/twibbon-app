import { type KeyboardEvent as ReactKeyboardEvent, useRef } from 'react'
import { type FrameSize, isValidSlot, type SlotRect as Rect, toPixels } from '@/lib/geometry'
import { SlotRect } from './slot-rect'
import { useDragResize } from './use-drag-resize'
import { useElementSize } from './use-element-size'

/** Satu tekan panah menggeser sebesar ini, dalam persen. */
const NUDGE = 1

type Props = {
  frameSrc: string
  /** Dimensi asli frame dalam piksel — dipakai memeriksa ukuran minimum slot. */
  frameSize: FrameSize
  slots: readonly Rect[]
  onChange: (slots: Rect[]) => void
  selectedIndex: number
  onSelect: (index: number) => void
}

export function AreaEditor({
  frameSrc,
  frameSize,
  slots,
  onChange,
  selectedIndex,
  onSelect,
}: Props) {
  const imageRef = useRef<HTMLImageElement>(null)
  // Piksel tampilan, bukan piksel asli: gambar frame dilebarkan mengikuti
  // kolomnya. Slot tersimpan dalam persen, jadi keduanya tetap sepakat.
  const display = useElementSize(imageRef)
  const drag = useDragResize({ slots, display, onChange })

  function handleKeyDown(index: number, event: ReactKeyboardEvent) {
    const arah: Record<string, [number, number]> = {
      ArrowLeft: [-NUDGE, 0],
      ArrowRight: [NUDGE, 0],
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
    }
    const langkah = arah[event.key]
    if (!langkah) return

    event.preventDefault()
    // Shift menahan sudut kiri-atas dan menggerakkan sudut kanan-bawah,
    // sehingga panah yang sama bisa dipakai untuk mengubah ukuran.
    drag.nudge(index, event.shiftKey ? 'se' : 'move', langkah[0], langkah[1])
  }

  return (
    <div className="relative select-none overflow-hidden rounded-card border border-border bg-surface2">
      {/* Gambar frame yang jadi latar. Dekoratif: informasinya sudah ada di
          nama campaign dan label tiap area. */}
      <img
        ref={imageRef}
        src={frameSrc}
        alt=""
        draggable={false}
        className="block w-full"
        // Checkerboard supaya bagian transparan PNG terlihat sebagai transparan,
        // bukan sebagai putih atau hitam.
        style={{
          backgroundImage:
            'linear-gradient(45deg, var(--color-border) 25%, transparent 25%), linear-gradient(-45deg, var(--color-border) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-border) 75%), linear-gradient(-45deg, transparent 75%, var(--color-border) 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        width={display.width}
        height={display.height}
        viewBox={`0 0 ${display.width || 1} ${display.height || 1}`}
        style={{ touchAction: 'none' }}
        onPointerMove={drag.move}
        onPointerUp={drag.end}
        onPointerCancel={drag.end}
        aria-label="Area foto di atas frame"
      >
        <title>Area foto</title>
        {slots.map((slot, index) => (
          <SlotRect
            // Slot belum punya id sampai tersimpan; urutannya yang jadi
            // identitas, dan urutan itu memang tidak berubah saat digeser.
            // biome-ignore lint/suspicious/noArrayIndexKey: lihat catatan di atas
            key={index}
            index={index}
            rect={toPixels(slot, display)}
            bounds={display}
            isSelected={index === selectedIndex}
            isValid={isValidSlot(slot, frameSize)}
            onSelect={() => onSelect(index)}
            onHandleDown={(mode, event) => drag.begin(index, mode, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
          />
        ))}
      </svg>
    </div>
  )
}
