import { Camera01Icon, Refresh01Icon, RotateLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"

type Props = {
  nama: string
  adaFoto: boolean
  onPilihFoto: (berkas: File | undefined) => void
  skala: number
  onSkala: (nilai: number) => void
  onReset: () => void
}

/**
 * Panel kontrol untuk SATU slot yang sedang dipilih. Berubah otomatis saat
 * seleksi berpindah — bukan satu slider per area (brief: jangan pernah render
 * slider berjajar per slot).
 *
 * Aksi (Putar/Balik) sengaja disabled sebagai placeholder: rotasi, flip,
 * crop, AI auto fit, dan undo/redo masuk di sini tanpa mengubah layout.
 */
export function EditPanel({ nama, adaFoto, onPilihFoto, skala, onSkala, onReset }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-sm font-semibold">Atur · {nama}</h3>
        <span className="shrink-0 rounded-lg border border-border bg-muted px-2.5 py-0.5 font-mono text-sm text-primary">
          {Math.round(skala * 100)}%
        </span>
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium transition-colors hover:bg-accent">
        <HugeiconsIcon icon={adaFoto ? Refresh01Icon : Camera01Icon} aria-hidden />
        {adaFoto ? "Ganti foto" : "Upload foto"}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onPilihFoto(e.target.files?.[0])}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Zoom
        </span>
        <input
          type="range"
          min={0.25}
          max={3}
          step={0.01}
          value={skala}
          disabled={!adaFoto}
          onChange={(e) => onSkala(Number(e.target.value))}
          className="w-full accent-brand disabled:opacity-50"
          aria-label={`Zoom foto ${nama}`}
        />
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onReset} disabled={!adaFoto}>
        <HugeiconsIcon icon={RotateLeft01Icon} aria-hidden /> Reset posisi
      </Button>

      {/* Tempat fitur mendatang: Rotate, Flip, Crop, AI Auto Fit, Undo/Redo. */}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="sm" disabled title="Segera hadir">
          Putar
        </Button>
        <Button type="button" variant="outline" size="sm" disabled title="Segera hadir">
          Balik
        </Button>
      </div>
    </div>
  )
}
