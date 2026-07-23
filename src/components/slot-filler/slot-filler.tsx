import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useElementSize } from '@/components/area-editor/use-element-size'
import { Button } from '@/components/ui/button'
import { IDENTITAS, renderComposite, type SlotFill, type Transform } from '@/lib/composite'
import type { FrameSize, SlotRect } from '@/lib/geometry'
import { useSlotTransform } from './use-slot-transform'

/** Sisi terpanjang kanvas preview di layar. */
const PREVIEW_MAKS = 460

export type ModeIsi = 'satu' | 'perSlot'

/**
 * Slot seperti yang diterima halaman partisipan: koordinat plus label.
 * `SlotRect` di geometry.ts sengaja tetap tipe koordinat murni (P2).
 */
export type SlotTampil = SlotRect & { label?: string }

type Props = {
  frameSrc: string
  frameSize: FrameSize
  slots: readonly SlotTampil[]
  mode: ModeIsi
  onMode: (mode: ModeIsi) => void
  /** Mode `satu`: foto tunggal untuk semua slot. */
  photo: HTMLImageElement | null
  /** Mode `perSlot`: satu foto per indeks slot. */
  fotoPerSlot: Record<number, HTMLImageElement>
  onPilihFotoSlot: (index: number, berkas: File | undefined) => void
  /** Menyerahkan pembaca isi ke halaman, supaya unduhan memakai nilai terkini. */
  onGetFill: (getFill: (index: number) => SlotFill | undefined) => void
  onUnduh: (scale: number) => void
  sedangUnduh: boolean
}

export function SlotFiller({
  frameSrc,
  frameSize,
  slots,
  mode,
  onMode,
  photo,
  fotoPerSlot,
  onPilihFotoSlot,
  onGetFill,
  onUnduh,
  sedangUnduh,
}: Props) {
  const kanvasRef = useRef<HTMLCanvasElement>(null)
  const [frame, setFrame] = useState<HTMLImageElement | null>(null)
  const [slotAktif, setSlotAktif] = useState(0)

  /** Posisi tersimpan tiap slot di mode perSlot. */
  const transforms = useRef<Record<number, Transform>>({})

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setFrame(img)
    img.src = frameSrc
  }, [frameSrc])

  const rasio = frameSize.width / frameSize.height
  // Ukuran bitmap kanvas — resolusi gambarnya, bukan ukurannya di layar.
  const lebarPreview = rasio >= 1 ? PREVIEW_MAKS : Math.round(PREVIEW_MAKS * rasio)

  /*
   * Ukuran TAMPILAN diukur, bukan diasumsikan. Di layar sempit CSS mengecilkan
   * kanvas supaya tidak meluber, dan kalau matematika geser tetap memakai
   * ukuran bitmap-nya, tracking 1:1 akan meleset persis sebesar rasio
   * pengecilan itu.
   * ponytail: useElementSize sudah ada dan sudah terpakai di area editor.
   */
  const kanvasSize = useElementSize(kanvasRef)

  const t = useSlotTransform({
    image: mode === 'satu' ? photo : (fotoPerSlot[slotAktif] ?? null),
    slots,
    canvas: kanvasSize,
    // Mode satu foto: semua slot bergerak bersamaan, jadi tidak ada slot yang
    // "aktif" dan tarikan di slot mana pun diterima.
    slotAktif: mode === 'satu' ? -1 : slotAktif,
  })

  /*
   * Inti spec 6.2: mode single dan multi bukan dua fitur, melainkan satu fitur
   * dengan sumber isi berbeda. Yang berganti hanya fungsi pencari ini —
   * renderComposite tidak pernah tahu mode mana yang aktif.
   */
  const getFill = useCallback(
    (index: number): SlotFill | undefined => {
      if (mode === 'satu') {
        return photo ? { image: photo, transform: t.bacaTransform() } : undefined
      }
      const img = fotoPerSlot[index]
      if (!img) return undefined
      // Slot yang sedang digeser membaca motion value; sisanya membaca posisi
      // tersimpannya masing-masing.
      return {
        image: img,
        transform:
          index === slotAktif ? t.bacaTransform() : (transforms.current[index] ?? IDENTITAS),
      }
    },
    [mode, photo, fotoPerSlot, slotAktif, t.bacaTransform],
  )

  useEffect(() => {
    onGetFill(getFill)
  }, [onGetFill, getFill])

  function pilihSlot(index: number) {
    if (index === slotAktif) return
    transforms.current[slotAktif] = t.bacaTransform()
    setSlotAktif(index)
    t.muat(transforms.current[index] ?? IDENTITAS)
  }

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
        getFill,
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
  }, [frame, frameSize, slots, lebarPreview, getFill, t.offsetX, t.offsetY])

  const adaIsi = mode === 'satu' ? Boolean(photo) : Object.keys(fotoPerSlot).length > 0

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mode satu foto ditawarkan lebih dulu dan jadi bawaan (PRD US-04).
          ponytail: dua tombol yang sudah ada, bukan komponen tabs baru. */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'satu' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onMode('satu')}
        >
          Satu foto
        </Button>
        <Button
          type="button"
          variant={mode === 'perSlot' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onMode('perSlot')}
        >
          Upload per Slot
        </Button>
      </div>

      {/* biome-ignore lint/a11y/noStaticElementInteractions: kanvas komposit memang permukaan gesture dan tidak punya padanan elemen semantik; jalur non-pointer disediakan slider zoom dan tombol reset di bawahnya. */}
      <canvas
        ref={kanvasRef}
        style={{
          // Menyusut mengikuti lebar yang tersedia, tapi tidak pernah lebih
          // besar dari resolusi bitmap-nya.
          width: '100%',
          maxWidth: lebarPreview,
          height: 'auto',
          touchAction: 'none',
          cursor: adaIsi ? 'grab' : 'default',
        }}
        className="rounded-xl shadow-[0_8px_40px_#00000050]"
        onPointerDown={t.mulai}
        onPointerMove={t.geser}
        onPointerUp={t.selesai}
        onPointerCancel={t.selesai}
      />

      {mode === 'perSlot' && (
        <div className="flex w-full max-w-md flex-col gap-2">
          {slots.map((slot, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: urutan slot adalah identitasnya
              key={index}
              className={`flex items-center gap-2 rounded-lg border p-2 ${
                index === slotAktif ? 'border-primary bg-muted' : 'border-border bg-card'
              }`}
            >
              <Button
                type="button"
                variant={index === slotAktif ? 'default' : 'outline'}
                size="sm"
                onClick={() => pilihSlot(index)}
              >
                {index + 1}
              </Button>
              <span className="flex-1 truncate text-sm text-muted-foreground">
                {slot.label || `Area ${index + 1}`}
                {!fotoPerSlot[index] && ' · belum ada foto'}
              </span>
              <label className="cursor-pointer rounded-lg border border-border px-3 py-1 text-xs transition-colors hover:bg-muted">
                {fotoPerSlot[index] ? 'Ganti' : 'Pilih foto'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    onPilihFotoSlot(index, e.target.files?.[0])
                    pilihSlot(index)
                  }}
                />
              </label>
            </div>
          ))}
          <p className="text-center text-xs text-muted-foreground">Maksimal 5MB per slot</p>
        </div>
      )}

      {adaIsi && (
        <div className="flex w-full max-w-md flex-col gap-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Zoom {mode === 'perSlot' ? `· area ${slotAktif + 1}` : ''}
              </span>
              <span className="rounded-lg border border-border bg-muted px-2.5 py-0.5 font-mono text-sm text-primary">
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
              className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowCounterClockwise aria-hidden /> Reset posisi
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
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
          <p className="text-center text-xs text-muted-foreground">
            {frameSize.width}×{frameSize.height} px pada 1×
          </p>
        </div>
      )}
    </div>
  )
}
