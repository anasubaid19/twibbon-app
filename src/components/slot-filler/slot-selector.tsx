import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Props = {
  slots: readonly { label?: string }[]
  fotoPerSlot: Record<number, HTMLImageElement>
  selected: number
  onSelect: (index: number) => void
}

/**
 * Pemilih slot yang kompak: thumbnail, nama, dan status unggahan dalam satu
 * kartu. Menggantikan daftar unggahan vertikal yang panjang — klik kartu
 * langsung memindah target edit.
 *
 * Desktop: daftar vertikal. Mobile: chip yang digeser horizontal.
 */
export function SlotSelector({ slots, fotoPerSlot, selected, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
      {slots.map((slot, index) => {
        const foto = fotoPerSlot[index]
        const aktif = index === selected
        return (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: urutan slot adalah identitasnya
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-pressed={aktif}
            aria-label={`Area ${index + 1}: ${foto ? "foto terpilih" : "kosong"}`}
            className={cn(
              "flex w-56 shrink-0 items-center gap-3 rounded-xl border bg-card p-2 text-left transition-colors md:w-full",
              aktif
                ? "border-primary ring-1 ring-primary/40"
                : "border-border hover:border-primary/40",
            )}
          >
            <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              {foto && <img src={foto.src} alt="" className="size-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{slot.label || `Area ${index + 1}`}</p>
              <Badge variant={foto ? "default" : "netral"} className="mt-0.5">
                {foto ? "Photo Selected" : "Empty"}
              </Badge>
            </div>
          </button>
        )
      })}
    </div>
  )
}
