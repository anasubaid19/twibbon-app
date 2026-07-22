import { HeaderMenu } from "@/components/header-menu"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Header() {
  return (
    <header
      className={cn(
        "sticky top-4 z-50 mx-auto flex h-14 w-[92svw] items-center justify-between rounded-full border bg-background/95 px-2 shadow-sm backdrop-blur-sm supports-backdrop-filter:bg-background/50",
        "md:max-w-3xl"
      )}
      style={{
        // @ts-expect-error
        cornerShape: "squircle",
      }}
    >
      <a
        className="flex h-10 cursor-pointer items-center justify-center rounded-full hover:bg-accent"
        href="#"
        style={{
          // @ts-expect-error
          cornerShape: "squircle",
        }}
      >
        <Logo className="size-9" />
        <span className="sr-only">Faiz UI</span>
      </a>

      <div className="flex items-center gap-2">
        <Button
          className="rounded-full"
          size="lg"
          style={{
            // @ts-expect-error
            cornerShape: "squircle",
          }}
          variant="outline"
        >
          Docs
        </Button>
        <HeaderMenu />
      </div>
    </header>
  )
}
