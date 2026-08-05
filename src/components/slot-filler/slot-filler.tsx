import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { useElementSize } from "@/components/area-editor/use-element-size"
import { Button } from "@/components/ui/button"
import { renderComposite, type SlotFill, slotAt } from "@/lib/composite"
import { type FrameSize, type SlotRect, toPixels } from "@/lib/geometry"
import { EditPanel } from "./edit-panel"
import { SlotSelector } from "./slot-selector"
import { useSlotTransform } from "./use-slot-transform"

/** Sisi terpanjang kanvas preview di layar. */
const PREVIEW_MAKS = 460

/**
 * Slot seperti yang diterima halaman partisipan: koordinat plus label.
 * `SlotRect` di geometry.ts sengaja tetap tipe koordinat murni (P2).
 */
export type SlotTampil = SlotRect & { label?: string }

type Props = {
  frameSrc: string
  frameSize: FrameSize
  slots: readonly SlotTampil[]
  /** Satu foto per indeks slot. */
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
  fotoPerSlot,
  onPilihFotoSlot,
  onGetFill,
  onUnduh,
  sedangUnduh,
}: Props) {
  const kanvasRef = useRef<HTMLCanvasElement>(null)
  const [frame, setFrame] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
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

  // Transform tinggal di ref (di dalam hook), jadi gambar() selalu lewat
  // ref ini agar memakai fungsi terbaru tanpa menandai dependensi.
  const gambarRef = useRef<() => void>(() => {})
  const redraw = useCallback(() => gambarRef.current(), [])

  const t = useSlotTransform({
    fotoPerSlot,
    slots,
    canvas: kanvasSize,
    redraw,
  })

  /** Slot yang sedang diatur. Klik area di preview atau kartu memindahnya. */
  const [selected, setSelected] = useState(0)

  const getFill = useCallback(
    (index: number): SlotFill | undefined => {
      const img = fotoPerSlot[index]
      if (!img) return undefined
      return { image: img, transform: t.bacaTransform(index) }
    },
    [fotoPerSlot, t.bacaTransform],
  )

  const gambar = useCallback(() => {
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
    kanvas.getContext("2d")?.drawImage(hasil, 0, 0)
  }, [frame, frameSize, slots, lebarPreview, getFill])

  gambarRef.current = gambar

  // Gambar ulang saat apa pun berubah — frame termuat, slot, foto baru.
  useEffect(() => {
    gambar()
  }, [gambar])

  useEffect(() => {
    onGetFill(getFill)
  }, [onGetFill, getFill])

  /** Klik area memilih slot; tarikan tetap menggeser foto di slot itu. */
  function onCanvasPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const kena = slotAt(
      slots,
      { x: event.clientX - box.left, y: event.clientY - box.top },
      kanvasSize,
    )
    if (kena >= 0) setSelected(kena)
    t.mulai(event)
  }

  function onCanvasKeyDown(event: ReactKeyboardEvent<HTMLCanvasElement>) {
    const arah: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }
    const langkah = arah[event.key]
    if (!langkah || !fotoPerSlot[selected]) return

    event.preventDefault()
    t.nudge(selected, langkah[0], langkah[1])
  }

  const jumlahTerisi = Object.keys(fotoPerSlot).length
  const adaIsi = jumlahTerisi > 0
  const persen = slots.length ? Math.round((jumlahTerisi / slots.length) * 100) : 0

  function UnduhRow() {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Unduh</span>
        <div className="grid flex-1 grid-cols-3 gap-2">
          {[1, 2, 3].map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={s === 1 ? "default" : "outline"}
              disabled={sedangUnduh}
              onClick={() => onUnduh(s)}
            >
              {sedangUnduh ? "…" : `${s}×`}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid w-full gap-6 pb-24 md:pb-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* Kiri: preview tetap terlihat saat kolom kanan digulir. */}
      <div className="flex min-w-0 flex-col items-center gap-4 lg:sticky lg:top-6 lg:self-start">
        <div className="relative w-full" style={{ maxWidth: lebarPreview }}>
          <canvas
            ref={kanvasRef}
            style={{
              width: "100%",
              height: "auto",
              touchAction: "none",
              cursor: adaIsi ? "grab" : "default",
            }}
            className="block rounded-xl shadow-[0_8px_40px_#00000050] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            tabIndex={0}
            aria-label="Pratinjau foto. Gunakan tombol panah untuk menggeser foto di area terpilih."
            onPointerDown={onCanvasPointerDown}
            onPointerMove={t.geser}
            onPointerUp={t.selesai}
            onPointerCancel={t.selesai}
            onKeyDown={onCanvasKeyDown}
          />

          {/* Outline area di atas kanvas. pointer-events-none supaya tidak
              menghalangi tarikan — outline hidup di overlay, bukan di
              renderComposite, jadi tidak ikut ke berkas unduhan. */}
          {kanvasSize.width > 0 && (
            <svg
              className="pointer-events-none absolute inset-0"
              width={kanvasSize.width}
              height={kanvasSize.height}
              viewBox={`0 0 ${kanvasSize.width} ${kanvasSize.height}`}
              role="presentation"
            >
              <title>Area foto</title>
              {slots.map((slot, index) => {
                const kotak = toPixels(slot, kanvasSize)
                const derajat = slot.rotation ?? 0
                const aktif = index === selected
                return (
                  <g
                    // biome-ignore lint/suspicious/noArrayIndexKey: urutan slot adalah identitasnya
                    key={index}
                    transform={
                      derajat
                        ? `rotate(${derajat} ${kotak.x + kotak.width / 2} ${kotak.y + kotak.height / 2})`
                        : undefined
                    }
                  >
                    <rect
                      x={kotak.x}
                      y={kotak.y}
                      width={kotak.width}
                      height={kotak.height}
                      fill={aktif ? "var(--color-primary)" : "transparent"}
                      fillOpacity={aktif ? 0.08 : 0}
                      stroke={aktif ? "var(--color-primary)" : "var(--color-border)"}
                      strokeWidth={aktif ? 2 : 1}
                      rx={2}
                    />
                  </g>
                )
              })}
            </svg>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Klik area untuk memilih, geser fotonya untuk mengatur posisi.
        </p>

        <div className="flex w-full max-w-sm flex-col gap-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {jumlahTerisi} / {slots.length} foto terunggah
              </span>
              <span>{persen}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${persen}%` }}
              />
            </div>
          </div>

          {adaIsi && (
            <div className="hidden flex-col gap-2 md:flex">
              <UnduhRow />
              <p className="text-center text-xs text-muted-foreground">
                {frameSize.width}×{frameSize.height} px pada 1×
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Kanan: selector + panel edit slot yang sedang dipilih. */}
      <div className="flex min-w-0 w-full flex-col gap-4">
        <SlotSelector
          slots={slots}
          fotoPerSlot={fotoPerSlot}
          selected={selected}
          onSelect={setSelected}
        />
        <EditPanel
          nama={slots[selected]?.label || `Area ${selected + 1}`}
          adaFoto={Boolean(fotoPerSlot[selected])}
          onPilihFoto={(berkas) => onPilihFotoSlot(selected, berkas)}
          skala={t.scaleOf(selected)}
          onSkala={(nilai) => t.setScale(selected, nilai)}
          onReset={() => t.reset(selected)}
        />
      </div>

      {/* Mobile: unduhan menempel di bawah, siap diakses tanpa menggulir.
          Portal ke body karena ancestor ber-transform (animasi fade-up) akan
          menelan position:fixed dan bar-nya ikut menggeser. */}
      {adaIsi &&
        createPortal(
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
            <UnduhRow />
          </div>,
          document.body,
        )}
    </div>
  )
}
