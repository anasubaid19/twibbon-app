import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react"
import type { DragMode, FrameSize, PixelRect } from "@/lib/geometry"

/** Sisi pegangan resize dalam piksel tampilan. */
const HANDLE = 10
/** Jarak rotate handle di atas kotak, dalam piksel tampilan. */
const ROTASI_JARAK = 18

/**
 * Delapan pegangan: 4 sudut + 4 sisi. `fx`/`fy` adalah posisinya sebagai
 * pecahan dari kotak, jadi satu daftar ini melayani kotak ukuran apa pun.
 */
const HANDLES: ReadonlyArray<{
  mode: DragMode
  fx: number
  fy: number
  cursor: string
  label: string
}> = [
  { mode: "nw", fx: 0, fy: 0, cursor: "nwse-resize", label: "kiri atas" },
  { mode: "n", fx: 0.5, fy: 0, cursor: "ns-resize", label: "atas" },
  { mode: "ne", fx: 1, fy: 0, cursor: "nesw-resize", label: "kanan atas" },
  { mode: "e", fx: 1, fy: 0.5, cursor: "ew-resize", label: "kanan" },
  { mode: "se", fx: 1, fy: 1, cursor: "nwse-resize", label: "kanan bawah" },
  { mode: "s", fx: 0.5, fy: 1, cursor: "ns-resize", label: "bawah" },
  { mode: "sw", fx: 0, fy: 1, cursor: "nesw-resize", label: "kiri bawah" },
  { mode: "w", fx: 0, fy: 0.5, cursor: "ew-resize", label: "kiri" },
]

/**
 * Menahan pegangan supaya seluruh kotaknya tetap di dalam area gambar.
 *
 * Tanpa ini, slot yang menempel di tepi frame — kasus yang justru paling
 * sering, misalnya area foto full-bleed — punya pegangan yang separuhnya
 * menggantung di luar SVG. Induknya `overflow-hidden`, jadi separuh itu
 * terpotong: pegangannya terlihat cacat DAN titik tengahnya tidak bisa
 * diklik sama sekali.
 */
function tahanDiDalam(nilai: number, batas: number): number {
  return Math.min(Math.max(nilai, 0), Math.max(0, batas - HANDLE))
}

type Props = {
  index: number
  /** Kotak dalam piksel tampilan, sudah diterjemahkan lewat geometry.toPixels. */
  rect: PixelRect
  /** Rotasi derajat di sekitar tengah kotak. */
  rotation?: number
  /** Label opsional, ditampilkan di samping nomor. */
  label?: string
  /** Ukuran gambar frame di layar — batas supaya pegangan tidak terpotong. */
  bounds: FrameSize
  isSelected: boolean
  isValid: boolean
  onSelect: () => void
  onHandleDown: (mode: DragMode, event: ReactPointerEvent) => void
  onKeyDown: (event: ReactKeyboardEvent) => void
}

export function SlotRect({
  index,
  rect,
  rotation,
  label,
  bounds,
  isSelected,
  isValid,
  onSelect,
  onHandleDown,
  onKeyDown,
}: Props) {
  const stroke = isValid ? "var(--color-primary)" : "var(--color-destructive)"
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2
  const rotasiY = tahanDiDalam(rect.y - ROTASI_JARAK, bounds.height)

  return (
    // Seluruh kotak — rect, label, pegangan — ikut berotasi di sekitar
    // tengahnya. Pegangan rotate ikut berputar sehingga selalu di atas.
    <g transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}>
      {/* biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: aturan ini memakai heuristik elemen HTML; <rect> SVG tidak punya semantik interaktif bawaan, jadi `application` di sini menambah peran, bukan menurunkannya. */}
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        fill={isValid ? "rgb(202 255 51 / 0.16)" : "rgb(255 77 77 / 0.16)"}
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray={isSelected ? undefined : "6 4"}
        style={{ cursor: "move", touchAction: "none", outline: "none" }}
        tabIndex={0}
        /* `application`, bukan `button`: menekan Enter tidak melakukan apa pun di
           sini — kotaknya digerakkan panah. Peran ini juga memberi tahu pembaca
           layar supaya meneruskan tombol panah ke halaman alih-alih memakainya
           sendiri untuk berpindah baca, yang justru mematikan satu-satunya jalur
           keyboard yang kotak ini punya. */
        role="application"
        aria-roledescription="Area foto yang bisa digeser dan diubah ukurannya"
        aria-label={`Area foto ${index + 1}. Panah untuk menggeser, Shift+panah untuk mengubah ukuran.`}
        onFocus={onSelect}
        onPointerDown={(event) => {
          onSelect()
          onHandleDown("move", event)
        }}
        onKeyDown={onKeyDown}
      />

      <text
        x={rect.x + 8}
        y={rect.y + 20}
        fill={stroke}
        fontSize={13}
        fontWeight={700}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {label ? `${index + 1} · ${label}` : index + 1}
      </text>

      {isSelected && (
        <>
          <line x1={cx} y1={rect.y} x2={cx} y2={rotasiY} stroke={stroke} strokeWidth={2} />
          <circle
            cx={cx}
            cy={rotasiY}
            r={7}
            fill="var(--color-background)"
            stroke={stroke}
            strokeWidth={2}
            style={{ cursor: "grab", touchAction: "none" }}
            aria-label={`Putar area ${index + 1}. Geser untuk memutar, Shift menahan kelipatan 15 derajat.`}
            onPointerDown={(event) => {
              onSelect()
              onHandleDown("rotate", event)
            }}
          />
          {HANDLES.map((handle) => (
            <rect
              key={handle.mode}
              x={tahanDiDalam(rect.x + handle.fx * rect.width - HANDLE / 2, bounds.width)}
              y={tahanDiDalam(rect.y + handle.fy * rect.height - HANDLE / 2, bounds.height)}
              width={HANDLE}
              height={HANDLE}
              rx={2}
              fill="var(--color-background)"
              stroke={stroke}
              strokeWidth={2}
              style={{ cursor: handle.cursor, touchAction: "none" }}
              aria-label={`Ubah ukuran dari ${handle.label}`}
              onPointerDown={(event) => onHandleDown(handle.mode, event)}
            />
          ))}
        </>
      )}
    </g>
  )
}
