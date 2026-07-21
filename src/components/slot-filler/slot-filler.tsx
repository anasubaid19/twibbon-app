import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { renderComposite, type SlotFill, type Transform } from '@/lib/composite'
import type { FrameSize, SlotRect } from '@/lib/geometry'
import { useSlotTransform } from './use-slot-transform'

/** Sisi terpanjang kanvas preview di layar. */
const PREVIEW_MAKS = 460

type Props = {
  frameSrc: string
  frameSize: FrameSize
  slots: readonly SlotRect[]
  /** Foto partisipan. Null selama belum ada yang diunggah. */
  photo: HTMLImageElement | null
  /** Menyerahkan pembaca transform ke halaman, supaya unduhan memakai nilai terkini. */
  onTransform: (baca: () => Transform) => void
  onUnduh: (scale: number) => void
  sedangUnduh: boolean
}

export function SlotFiller({
  frameSrc,
  frameSize,
  slots,
  photo,
  onTransform,
  onUnduh,
  sedangUnduh,
}: Props) {
  const kanvasRef = useRef<HTMLCanvasElement>(null)
  const [frame, setFrame] = useState<HTMLImageElement | null>(null)

  // Frame dimuat sekali sebagai elemen gambar; renderComposite butuh elemen,
  // bukan URL.
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setFrame(img)
    img.src = frameSrc
  }, [frameSrc])

  const rasio = frameSize.width / frameSize.height
  const lebarPreview = rasio >= 1 ? PREVIEW_MAKS : Math.round(PREVIEW_MAKS * rasio)
  const tinggiPreview = rasio >= 1 ? Math.round(PREVIEW_MAKS / rasio) : PREVIEW_MAKS

  // ponytail: semua slot berbagi satu foto di fase ini, jadi ukuran acuan
  // geser diambil dari slot pertama. Mode multi-photo di Fase 5 mengganti
  // sumber isinya, bukan menambah cabang di sini.
  const slotPertama = slots[0]
  const slotSize = slotPertama
    ? {
        width: (slotPertama.width / 100) * lebarPreview,
        height: (slotPertama.height / 100) * tinggiPreview,
      }
    : { width: 0, height: 0 }

  const t = useSlotTransform({ image: photo, slotSize })

  useEffect(() => {
    onTransform(t.bacaTransform)
  }, [onTransform, t.bacaTransform])

  // Gambar ulang tiap kali apa pun berubah — termasuk tiap frame animasi
  // spring, lewat langganan MotionValue. Tidak ada state React yang berubah
  // saat menggeser, jadi tidak ada re-render per frame.
  useEffect(() => {
    function gambar() {
      const kanvas = kanvasRef.current
      if (!kanvas || !frame) return

      const hasil = renderComposite({
        frame,
        frameSize,
        slots,
        getFill: (): SlotFill | undefined =>
          photo ? { image: photo, transform: t.bacaTransform() } : undefined,
        scale: lebarPreview / frameSize.width,
      })

      kanvas.width = hasil.width
      kanvas.height = hasil.height
      kanvas.getContext('2d')?.drawImage(hasil, 0, 0)
    }

    gambar()
    const lepasX = t.offsetX.on('change', gambar)
    const lepasY = t.offsetY.on('change', gambar)
    return () => {
      lepasX()
      lepasY()
    }
  }, [frame, frameSize, slots, photo, lebarPreview, t.offsetX, t.offsetY, t.bacaTransform])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: kanvas komposit memang permukaan gesture dan tidak punya padanan elemen semantik; jalur non-pointer disediakan slider zoom dan tombol reset di bawahnya. */}
      <canvas
        ref={kanvasRef}
        style={{
          width: lebarPreview,
          height: tinggiPreview,
          touchAction: 'none',
          cursor: photo ? 'grab' : 'default',
        }}
        className="rounded-card shadow-[0_8px_40px_#00000050]"
        onPointerDown={t.mulai}
        onPointerMove={t.geser}
        onPointerUp={t.selesai}
        onPointerCancel={t.selesai}
      />

      {photo && (
        <div className="flex w-full max-w-md flex-col gap-3">
          <div className="rounded-base border border-border bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Zoom
              </span>
              <span className="rounded-pill border border-border bg-surface2 px-2.5 py-0.5 font-mono text-sm text-brand">
                {Math.round(t.scale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={t.scale}
              onChange={(e) => t.setScale(Number(e.target.value))}
              className="w-full accent-brand"
              aria-label="Zoom foto"
            />
            <button
              type="button"
              onClick={t.reset}
              className="mt-2 w-full text-xs text-muted transition-colors hover:text-text"
            >
              ↺ Reset posisi
            </button>
          </div>

          <p className="text-center text-sm text-muted">
            Geser fotonya langsung di gambar untuk mengatur posisi.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s) => (
              <Button
                key={s}
                type="button"
                variant={s === 1 ? 'default' : 'outline'}
                disabled={sedangUnduh}
                onClick={() => onUnduh(s)}
              >
                {sedangUnduh ? '…' : `Unduh ${s}×`}
              </Button>
            ))}
          </div>
          <p className="text-center text-xs text-muted">
            {frameSize.width}×{frameSize.height} px pada 1×
          </p>
        </div>
      )}
    </div>
  )
}
