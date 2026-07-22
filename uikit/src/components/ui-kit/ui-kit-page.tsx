"use client"

import { Link } from "@tanstack/react-router"
import { ThemeProvider, useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { catalogCategories } from "@/components/ui-kit/catalog"
import { ActionsSection } from "@/components/ui-kit/sections/actions"
import { AppComponentsSection } from "@/components/ui-kit/sections/app-components"
import { DataDisplaySection } from "@/components/ui-kit/sections/data-display"
import { DesignTokensSection } from "@/components/ui-kit/sections/design-tokens"
import { FeedbackSection } from "@/components/ui-kit/sections/feedback"
import { FormsSection } from "@/components/ui-kit/sections/forms"
import { LayoutSection } from "@/components/ui-kit/sections/layout"
import { NavigationSection } from "@/components/ui-kit/sections/navigation"
import { OverlaysSection } from "@/components/ui-kit/sections/overlays"
import { UiKitSidebar } from "@/components/ui-kit/ui-kit-sidebar"

export function UiKitPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <UiKitPageContent />
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}

function UiKitPageContent() {
  const { resolvedTheme, setTheme } = useTheme()

  const jumpLinks = catalogCategories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      category: category.label,
    }))
  )

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-title">UI Kit</h1>
            <p className="text-caption">
              Component catalog for this app — every export under{" "}
              <code className="text-mono">src/components</code>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              nativeButton={false}
              render={<Link to="/dashboard-1" />}
              variant="outline"
            >
              Dashboard 1
            </Button>
            <Button
              nativeButton={false}
              render={<Link to="/dashboard-2" />}
              variant="outline"
            >
              Dashboard 2
            </Button>
            <Button
              nativeButton={false}
              render={<Link to="/" />}
              variant="outline"
            >
              Back to home
            </Button>
            <Button
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              variant="outline"
            >
              Toggle theme
            </Button>
          </div>
        </div>
        <div className="border-t px-4 py-3 lg:hidden">
          <Select
            onValueChange={(value: string | null) => {
              if (value) {
                document
                  .getElementById(value)
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Jump to component…" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {jumpLinks.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.category} — {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-36">
            <UiKitSidebar />
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-16">
          <section className="flex flex-col gap-6">
            <h2 className="text-subtitle">Design Tokens</h2>
            <DesignTokensSection />
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-subtitle">App Components</h2>
            <AppComponentsSection />
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-subtitle">Actions</h2>
            <ActionsSection />
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-subtitle">Forms</h2>
            <FormsSection />
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-subtitle">Feedback</h2>
            <FeedbackSection />
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-subtitle">Overlays</h2>
            <OverlaysSection />
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-subtitle">Navigation</h2>
            <NavigationSection />
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-subtitle">Data Display</h2>
            <DataDisplaySection />
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-subtitle">Layout</h2>
            <LayoutSection />
          </section>
        </main>
      </div>
    </div>
  )
}
