import { useLoaderData } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

export function ThemeToggle() {
  // Ambil tema dari loader root, BUKAN dari `document`. Saat SSR `document`
  // tidak ada, jadi membacanya selalu jatuh ke 'dark' dan tombol ini
  // dirender dalam keadaan gelap meski cookie bilang terang — ikon dan
  // aria-label-nya keliru sampai JS termuat. Loader root sudah tahu tema
  // sebenarnya dari cookie, jadi server dan klien sepakat sejak awal.
  const initialTheme = useLoaderData({ from: '__root__' }) as Theme
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    /* biome-ignore lint/suspicious/noDocumentCookie: CookieStore API bersifat
       async dan mengembalikan Promise yang harus ditangani di dalam effect.
       Untuk satu penulisan sepele seperti ini, document.cookie yang sinkron
       lebih sederhana dan tidak punya kegagalan yang perlu diurus. */
    document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`
  }, [theme])

  return (
    <button
      type="button"
      aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      className="rounded-pill border border-border bg-surface2 px-3 py-1.5 text-base transition-colors hover:bg-border"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
