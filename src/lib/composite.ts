import { type FrameSize, type PixelRect, type SlotRect, toPixels } from "@/lib/geometry"

/**
 * Posisi foto di dalam satu slot.
 *
 * `offsetX`/`offsetY` adalah **pecahan dari ukuran slot**, bukan piksel. Itu
 * yang membuat transform yang sama menghasilkan hasil sebangun di 1x, 2x,
 * maupun 3x — syarat P3, karena preview dan unduhan memakai fungsi yang sama
 * dan cuma berbeda skala.
 */
export type Transform = { scale: number; offsetX: number; offsetY: number }

export const IDENTITAS: Transform = { scale: 1, offsetX: 0, offsetY: 0 }

/** Seberapa besar foto harus diperbesar agar menutup slot tanpa menyisakan celah. */
export function coverScale(image: FrameSize, slot: FrameSize): number {
  if (image.width <= 0 || image.height <= 0) return 1
  return Math.max(slot.width / image.width, slot.height / image.height)
}

/** Di mana foto digambar, dalam piksel kanvas yang sama dengan `slot`. */
export function drawRect(image: FrameSize, slot: PixelRect, t: Transform): PixelRect {
  const skala = coverScale(image, slot) * t.scale
  const width = image.width * skala
  const height = image.height * skala

  return {
    // Dipusatkan lebih dulu, baru digeser. Karena itu zoom membesar dari
    // tengah slot, bukan dari pojok kiri-atas.
    x: slot.x + (slot.width - width) / 2 + t.offsetX * slot.width,
    y: slot.y + (slot.height - height) / 2 + t.offsetY * slot.height,
    width,
    height,
  }
}

/**
 * Sejauh mana foto boleh digeser sebelum tepinya masuk ke dalam slot dan
 * meninggalkan celah kosong. Dinyatakan sebagai pecahan ukuran slot — satuan
 * yang sama dengan `Transform.offset*`.
 */
export function panBounds(
  image: FrameSize,
  slot: FrameSize,
  scale: number,
): { x: number; y: number } {
  const s = coverScale(image, slot) * scale
  const luberX = image.width * s - slot.width
  const luberY = image.height * s - slot.height
  return {
    x: slot.width > 0 ? Math.abs(luberX) / 2 / slot.width : 0,
    y: slot.height > 0 ? Math.abs(luberY) / 2 / slot.height : 0,
  }
}

/** Seberapa cepat perlawanan menumpuk di luar batas. Makin kecil, makin berat. */
const KEKENYALAN = 0.35

/**
 * Menahan gerakan di luar batas alih-alih menghentikannya mendadak (aturan 26).
 *
 * Bentuknya asimptotik, bukan linear: kelebihannya dibagi `1 + kelebihan`
 * sehingga makin jauh ditarik makin berat, dan tidak pernah benar-benar
 * berhenti. Berhenti keras terasa seperti aplikasi macet; ini terasa seperti
 * karet.
 */
export function rubberBand(offset: number, batas: number): number {
  const besar = Math.abs(offset)
  if (besar <= batas) return offset

  const kelebihan = besar - batas
  const ditahan = batas + (kelebihan * KEKENYALAN) / (1 + kelebihan)
  return Math.sign(offset) * ditahan
}

/**
 * Indeks slot yang berada di bawah sebuah titik kanvas, atau -1.
 *
 * Dicari dari belakang: slot bernomor besar digambar paling akhir dan karena
 * itu tampak paling atas, jadi yang terlihat itulah yang harus tersentuh.
 */
export function slotAt(
  slots: readonly SlotRect[],
  point: { x: number; y: number },
  canvas: FrameSize,
): number {
  for (let i = slots.length - 1; i >= 0; i--) {
    const slot = slots[i]
    if (!slot) continue
    const kotak = toPixels(slot, canvas)
    if (
      point.x >= kotak.x &&
      point.x <= kotak.x + kotak.width &&
      point.y >= kotak.y &&
      point.y <= kotak.y + kotak.height
    ) {
      return i
    }
  }
  return -1
}

/** Isi satu slot: fotonya dan posisinya. */
export type SlotFill = { image: HTMLImageElement; transform: Transform }

type RenderOpts = {
  frame: HTMLImageElement
  /** Dimensi asli frame dalam piksel; jadi acuan kanvas pada skala 1x. */
  frameSize: FrameSize
  slots: readonly SlotRect[]
  /** Mode single-photo mengembalikan isi yang sama untuk semua indeks. */
  getFill: (index: number) => SlotFill | undefined
  scale: number
}

/**
 * Menggambar komposit lengkap dan mengembalikan kanvasnya.
 *
 * Fungsi ini melayani preview di layar **dan** berkas unduhan; satu-satunya
 * yang berbeda adalah `scale` (P3). Tidak boleh ada cabang "kalau untuk
 * unduhan" di sini — begitu ada, preview dan hasil unduhan bisa berbeda, dan
 * itu justru kelas bug yang desain ini hapus.
 */
export function renderComposite({
  frame,
  frameSize,
  slots,
  getFill,
  scale,
}: RenderOpts): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(frameSize.width * scale)
  canvas.height = Math.round(frameSize.height * scale)

  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas

  const kanvasSize = { width: canvas.width, height: canvas.height }

  slots.forEach((slot, index) => {
    const fill = getFill(index)
    if (!fill) return

    const kotak = toPixels(slot, kanvasSize)

    ctx.save()
    // Foto dipotong tepat di batas slot. Tanpa ini bagian yang meluber akan
    // menutupi slot tetangga.
    ctx.beginPath()
    ctx.rect(kotak.x, kotak.y, kotak.width, kotak.height)
    ctx.clip()

    const gambar = drawRect(
      { width: fill.image.naturalWidth, height: fill.image.naturalHeight },
      kotak,
      fill.transform,
    )
    ctx.drawImage(fill.image, gambar.x, gambar.y, gambar.width, gambar.height)
    ctx.restore()
  })

  // Frame digambar paling akhir supaya transparansinya tetap menunjukkan foto
  // di bawahnya, bukan sebaliknya.
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
  return canvas
}
