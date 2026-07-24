import { type RefObject, useEffect, useState } from "react"
import type { FrameSize } from "@/lib/geometry"

/**
 * Ukuran render sebuah elemen dalam piksel CSS.
 *
 * Ukurannya berubah dua kali di luar kendali kita: saat gambar frame selesai
 * dimuat, dan saat jendela diubah ukurannya. Membacanya sekali lewat
 * `getBoundingClientRect` akan menjebak editor pada ukuran yang salah.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): FrameSize {
  const [size, setSize] = useState<FrameSize>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (box) setSize({ width: box.width, height: box.height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
