/**
 * Satu-satunya modul yang tahu cara menerjemahkan antara persen dan piksel.
 *
 * Spec P2: creator menggambar kotak, partisipan menggeser foto di dalam kotak
 * yang sama, dan compositing merender keduanya. Tiga tempat itu wajib memakai
 * modul ini. Dua implementasi koordinat berarti dua peluang untuk tidak
 * sinkron, dan bug semacam itu baru terlihat di berkas hasil unduhan.
 */

/** Kotak slot dalam persen 0–100 terhadap dimensi frame. Bentuk yang tersimpan di database. */
export type SlotRect = { x: number; y: number; width: number; height: number }

/** Kotak dalam piksel. Bisa piksel asli frame, bisa piksel elemen yang dirender di layar. */
export type PixelRect = { x: number; y: number; width: number; height: number }

/** Ukuran acuan dalam piksel. */
export type FrameSize = { width: number; height: number }

/** Arah tarikan: `move` menggeser seluruh kotak, sisanya menggerakkan sisi/sudut. */
export type DragMode = "move" | "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

/** Sisi terpendek slot yang masih masuk akal, dalam piksel asli frame. Spec bagian 10. */
export const MIN_SLOT_PX = 20

/**
 * Kelebihan sekecil ini datang dari pembulatan float saat roundtrip
 * persen→piksel→persen, bukan dari slot yang benar-benar keluar frame.
 */
const EPSILON = 0.001

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Frame belum punya ukuran selama gambar masih dimuat; jangan bagi dengan nol. */
function hasSize(frame: FrameSize): boolean {
  return frame.width > 0 && frame.height > 0
}

export function toPixels(rect: SlotRect, frame: FrameSize): PixelRect {
  return {
    x: (rect.x / 100) * frame.width,
    y: (rect.y / 100) * frame.height,
    width: (rect.width / 100) * frame.width,
    height: (rect.height / 100) * frame.height,
  }
}

export function toPercent(rect: PixelRect, frame: FrameSize): SlotRect {
  if (!hasSize(frame)) return { x: 0, y: 0, width: 0, height: 0 }
  return {
    x: (rect.x / frame.width) * 100,
    y: (rect.y / frame.height) * 100,
    width: (rect.width / frame.width) * 100,
    height: (rect.height / frame.height) * 100,
  }
}

/** Pergeseran pointer (piksel elemen yang dirender) menjadi pergeseran persen. */
export function deltaToPercent(
  dx: number,
  dy: number,
  frame: FrameSize,
): { dx: number; dy: number } {
  if (!hasSize(frame)) return { dx: 0, dy: 0 }
  return { dx: (dx / frame.width) * 100, dy: (dy / frame.height) * 100 }
}

/**
 * Aturan clamp untuk **menggeser**: kotak didorong kembali ke dalam frame dan
 * ukurannya dipertahankan. Kotak yang lebih besar dari frame dikecilkan karena
 * tidak ada posisi yang bisa memuatnya.
 */
export function clampToFrame(rect: SlotRect): SlotRect {
  const width = clamp(rect.width, 0, 100)
  const height = clamp(rect.height, 0, 100)
  return {
    x: clamp(rect.x, 0, 100 - width),
    y: clamp(rect.y, 0, 100 - height),
    width,
    height,
  }
}

/**
 * Aturan clamp untuk **resize**: tiap sisi berhenti sendiri di tepi frame.
 *
 * Bedanya dengan clampToFrame penting. Kalau resize memakai "geser masuk",
 * menarik sisi kanan sampai tepi akan ikut menyeret sisi kiri — kotaknya
 * berpindah padahal pengguna hanya bermaksud melebarkan.
 */
function clampEdges(rect: SlotRect): SlotRect {
  const left = clamp(rect.x, 0, 100)
  const top = clamp(rect.y, 0, 100)
  const right = clamp(rect.x + rect.width, 0, 100)
  const bottom = clamp(rect.y + rect.height, 0, 100)
  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  }
}

/**
 * Menerapkan tarikan pointer ke sebuah kotak. `dx`/`dy` dalam persen.
 * Hasilnya selalu sudah ter-clamp ke frame, jadi pemanggil tidak perlu
 * mengingat aturan mana yang berlaku untuk mode mana.
 */
export function applyDrag(rect: SlotRect, mode: DragMode, dx: number, dy: number): SlotRect {
  if (mode === "move") {
    return clampToFrame({ ...rect, x: rect.x + dx, y: rect.y + dy })
  }

  let { x, y, width, height } = rect
  if (mode.includes("w")) {
    x = rect.x + dx
    width = rect.width - dx
  }
  if (mode.includes("e")) width = rect.width + dx
  if (mode.includes("n")) {
    y = rect.y + dy
    height = rect.height - dy
  }
  if (mode.includes("s")) height = rect.height + dy

  // Tarikan yang melewati sisi seberang membalik kotaknya. Normalkan supaya
  // width/height tidak pernah negatif — nilai negatif lolos ke database
  // sebagai slot yang tidak mungkin dirender.
  if (width < 0) {
    x += width
    width = -width
  }
  if (height < 0) {
    y += height
    height = -height
  }

  return clampEdges({ x, y, width, height })
}

/**
 * Apakah slot layak disimpan. Dipakai editor untuk menyalakan tombol simpan
 * **dan** dipakai ulang di server — klien tidak pernah jadi satu-satunya
 * penjaga (spec bagian 10).
 */
export function isValidSlot(rect: SlotRect, frame: FrameSize): boolean {
  const values = [rect.x, rect.y, rect.width, rect.height]
  if (!values.every((value) => Number.isFinite(value))) return false
  if (rect.x < -EPSILON || rect.y < -EPSILON) return false
  if (rect.x + rect.width > 100 + EPSILON) return false
  if (rect.y + rect.height > 100 + EPSILON) return false

  const px = toPixels(rect, frame)
  return px.width >= MIN_SLOT_PX && px.height >= MIN_SLOT_PX
}
