import { createFileRoute } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/theme-toggle'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="font-display text-5xl">
        Open<span className="text-brand">Frame</span>
      </h1>
      <p className="text-muted">Bikin twibbon multi-slot. Gratis, tanpa email.</p>
      <ThemeToggle />
    </main>
  )
}
