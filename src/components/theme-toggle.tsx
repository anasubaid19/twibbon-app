import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // biome-ignore lint/suspicious/noDocumentCookie: Biome menyarankan CookieStore API, tapi Safari belum mendukungnya. document.cookie jalan di semua browser dan penulisannya sepele di sini.
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
