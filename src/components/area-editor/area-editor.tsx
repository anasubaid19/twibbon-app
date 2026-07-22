import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  clampToFrame,
  type FrameSize,
  isValidSlot,
  type SlotRect as Rect,
  toPercent,
  toPixels,
} from '@/lib/geometry'
import { SlotRect } from './slot-rect'
import { useDragResize } from './use-drag-resize'
import { useElementSize } from './use-element-size'

/** Satu tekan panah menggeser sebesar ini, dalam persen. */
const NUDGE = 1
/** Ukuran kotak baru dalam persen, dipusatkan di titik klik. */
const UKURAN_BARU = 20
/** PRD US-02. */
const MAKS_SLOT = 20

/**
 * Slot seperti yang dipegang editor: koordinat plus label opsional.
 *
 * `SlotRect` di geometry.ts sengaja tetap tipe koordinat murni — ia dipakai
 * juga oleh compositing, yang tidak peduli label.
 */
export type SlotEditor = Rect & { label?: string }

type Props = {
  frameSrc: string
  /** Dimensi asli frame dalam piksel — dipakai memeriksa ukuran minimum slot. */
  frameSize: FrameSize
  slots: readonly SlotEditor[]
  onChange: (slots: SlotEditor[]) => void
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

  const [modeTambah, setModeTambah] = useState(false)
  const terpilih = slots[selectedIndex]
  const penuh = slots.length >= MAKS_SLOT

  function handleBackgroundPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (!modeTambah || penuh) return

    // Titik klik diterjemahkan toPercent lalu ditahan clampToFrame — dua-duanya
    // sudah ada di geometry, jadi tidak ada matematika koordinat baru (P2).
    const box = event.currentTarget.getBoundingClientRect()
    const titik = toPercent(
      { x: event.clientX - box.left, y: event.clientY - box.top, width: 0, height: 0 },
      display,
    )

    onChange([
      ...slots,
      clampToFrame({
        x: titik.x - UKURAN_BARU / 2,
        y: titik.y - UKURAN_BARU / 2,
        width: UKURAN_BARU,
        height: UKURAN_BARU,
      }),
    ])
    onSelect(slots.length)
    setModeTambah(false)
  }

  function hapusTerpilih() {
    if (!terpilih || slots.length <= 1) return
    // ponytail: confirm() bawaan browser sudah cukup untuk pertanyaan ya/tidak
    // sesederhana ini. Dialog sendiri berarti satu komponen shadcn baru, state
    // terbuka/tertutup, dan penjebak fokus — untuk sesuatu yang tidak merusak
    // apa pun kalau dibatalkan.
    if (!confirm(`Hapus area ${selectedIndex + 1}?`)) return

    onChange(slots.filter((_, i) => i !== selectedIndex))
    // Pilihan digeser ke area sebelumnya supaya tidak menunjuk indeks yang
    // sudah tidak ada.
    onSelect(Math.max(0, selectedIndex - 1))
  }

  function pindah(arah: -1 | 1) {
    const tujuan = selectedIndex + arah
    if (tujuan < 0 || tujuan >= slots.length) return

    const berikut = [...slots]
    // Tukar tempat. Nomor yang dilihat partisipan adalah urutan array ini;
    // slotRows() di server menurunkan slotIndex darinya saat menyimpan, jadi
    // tidak ada yang perlu di-reindex di sini.
    const geser = berikut[selectedIndex]
    const digantikan = berikut[tujuan]
    if (!geser || !digantikan) return
    berikut[selectedIndex] = digantikan
    berikut[tujuan] = geser

    onChange(berikut)
    onSelect(tujuan)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative select-none overflow-hidden rounded-xl border border-border bg-muted">
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
          style={{ touchAction: 'none', cursor: modeTambah ? 'crosshair' : undefined }}
          onPointerDown={handleBackgroundPointerDown}
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
              label={slot.label}
              isSelected={index === selectedIndex}
              isValid={isValidSlot(slot, frameSize)}
              onSelect={() => onSelect(index)}
              onHandleDown={(mode, event) => drag.begin(index, mode, event)}
              onKeyDown={(event) => handleKeyDown(index, event)}
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
        <Button
          type="button"
          variant={modeTambah ? 'default' : 'outline'}
          size="sm"
          disabled={penuh}
          onClick={() => setModeTambah((m) => !m)}
        >
          {modeTambah ? 'Klik di frame…' : '+ Tambah Area'}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={selectedIndex <= 0}
          aria-label="Naikkan urutan area"
          onClick={() => pindah(-1)}
        >
          ↑
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={selectedIndex >= slots.length - 1}
          aria-label="Turunkan urutan area"
          onClick={() => pindah(1)}
        >
          ↓
        </Button>
        {/* Mati saat tersisa satu: campaign tanpa area akan ditolak server
            (slots.min(1)), jadi lebih baik dicegah di sini daripada membiarkan
            pengguna menabrak pesan error saat menyimpan. */}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={slots.length <= 1}
          onClick={hapusTerpilih}
        >
          Hapus area
        </Button>

        <Input
          value={terpilih?.label ?? ''}
          maxLength={40}
          placeholder={`Label area ${selectedIndex + 1} (opsional)`}
          disabled={!terpilih}
          className="h-8 w-52"
          onChange={(event) =>
            onChange(
              slots.map((slot, i) =>
                i === selectedIndex ? { ...slot, label: event.target.value } : slot,
              ),
            )
          }
        />

        <span className="px-1 text-sm text-muted-foreground">
          {slots.length} area{terpilih ? ` · area ${selectedIndex + 1} terpilih` : ''}
          {penuh ? ' · maksimal' : ''}
        </span>
      </div>
    </div>
  )
}
