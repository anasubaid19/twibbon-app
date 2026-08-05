import {
  Camera01Icon,
  FilterResetIcon,
  ImageFlipHorizontalIcon,
  ImageFlipVerticalIcon,
  Refresh01Icon,
  RotateLeft01Icon,
  RotateRight01Icon,
  ZoomInAreaIcon,
  ZoomOutAreaIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"

type Props = {
  nama: string
  adaFoto: boolean
  onPilihFoto: (berkas: File | undefined) => void
  skala: number
  onSkala: (nilai: number) => void
  onPutar: (delta: -90 | 90) => void
  onFlipH: () => void
  onFlipV: () => void
  onReset: () => void
}

const LANGKAH = 0.1

/**
 * Panel kontrol untuk SATU slot yang sedang dipilih. Berubah otomatis saat
 * seleksi berpindah — bukan satu slider per area (brief: jangan pernah render
 * slider berjajar per slot).
 */
export function EditPanel({
  nama,
  adaFoto,
  onPilihFoto,
  skala,
  onSkala,
  onPutar,
  onFlipH,
  onFlipV,
  onReset,
}: Props) {
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
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Perkecil zoom foto ${nama}`}
            disabled={!adaFoto}
            onClick={() => onSkala(Math.max(0.25, Math.round((skala - LANGKAH) * 100) / 100))}
          >
            <HugeiconsIcon icon={ZoomOutAreaIcon} aria-hidden />
          </Button>
          <input
            type="range"
            min={0.25}
            max={3}
            step={0.01}
            value={skala}
            disabled={!adaFoto}
            onChange={(e) => onSkala(Number(e.target.value))}
            className="w-full accent-primary disabled:opacity-50"
            aria-label={`Zoom foto ${nama}`}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Perbesar zoom foto ${nama}`}
            disabled={!adaFoto}
            onClick={() => onSkala(Math.min(3, Math.round((skala + LANGKAH) * 100) / 100))}
          >
            <HugeiconsIcon icon={ZoomInAreaIcon} aria-hidden />
          </Button>
        </div>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onReset} disabled={!adaFoto}>
        <HugeiconsIcon icon={FilterResetIcon} aria-hidden /> Reset posisi
      </Button>

      <div className="grid grid-cols-4 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Putar foto ${nama} ke kiri`}
          disabled={!adaFoto}
          onClick={() => onPutar(-90)}
          title="Putar ke kiri"
        >
          <HugeiconsIcon icon={RotateLeft01Icon} aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Putar foto ${nama} ke kanan`}
          disabled={!adaFoto}
          onClick={() => onPutar(90)}
          title="Putar ke kanan"
        >
          <HugeiconsIcon icon={RotateRight01Icon} aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Balik foto ${nama} horizontal`}
          disabled={!adaFoto}
          onClick={onFlipH}
          title="Balik horizontal"
        >
          <HugeiconsIcon icon={ImageFlipHorizontalIcon} aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Balik foto ${nama} vertikal`}
          disabled={!adaFoto}
          onClick={onFlipV}
          title="Balik vertikal"
        >
          <HugeiconsIcon icon={ImageFlipVerticalIcon} aria-hidden />
        </Button>
      </div>
    </div>
  )
}
