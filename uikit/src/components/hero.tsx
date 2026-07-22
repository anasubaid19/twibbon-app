"use client"
import { ArrowRight02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function HeroSection() {
  return (
    <section className="w-full px-4 pt-24">
      <div
        className={cn(
          "relative z-10 flex w-full flex-col items-center justify-center gap-5 px-4"
        )}
      >
        <a
          className={cn(
            "group flex w-fit items-center gap-2 rounded-lg border bg-card p-1 shadow-xs",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards transition-all delay-500 duration-slow ease-entrance"
          )}
          href="#link"
        >
          <div className="rounded-lg border bg-card px-1.5 py-0.5 shadow-sm">
            <p className="text-mono">NEW</p>
          </div>

          <span className="text-label">Introducing Faiz UI v1</span>
          <span className="block h-5 border-l" />

          <div className="pr-1">
            <HugeiconsIcon
              icon={ArrowRight02Icon}
              strokeWidth={2}
              className="size-3 -translate-x-0.5 duration-fast ease-out group-hover:translate-x-0"
            />
          </div>
        </a>

        <h1
          className={cn(
            "text-center text-foreground text-display",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-slow ease-entrance"
          )}
        >
          Ship Beautiful UIs <br /> Without Starting From Scratch
        </h1>

        <p
          className={cn(
            "text-lead text-center text-muted-foreground",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-slow ease-entrance"
          )}
        >
          A premium UI kit and boilerplate built on shadcn/ui — 60+ components,
          <br /> ready-made blocks, and sensible defaults so you ship faster.
        </p>

        <div className="fade-in slide-in-from-bottom-10 flex w-fit animate-in items-center justify-center gap-3 fill-mode-backwards pt-2 delay-300 duration-slow ease-entrance">
          <Button size="lg" variant="ghost">
            Browse Components
          </Button>
          <Button size="lg">
            Get started{" "}
            <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={2} />
          </Button>
        </div>
      </div>

      <div className="relative mx-auto mt-5 flex aspect-video w-full max-w-6xl items-end justify-center overflow-hidden md:aspect-10/5">
        {/* Left Card (Faded Background) */}
        <motion.div
          animate={{ y: "0px", rotate: -6, x: "-90%" }}
          className="absolute -bottom-12 left-[70%] hidden h-auto w-[75%] opacity-75 blur-[1px] md:block"
          initial={{ y: "60px", rotate: 0, x: "-80%" }}
          transition={{ duration: 1, ease: "circOut" }}
        >
          <ScreenCard />
        </motion.div>

        {/* Center Card (Main) */}
        <motion.div
          animate={{ y: "0px" }}
          className="z-20 size-full md:h-auto md:w-[75%]"
          initial={{ y: "48px" }}
          transition={{ duration: 1, ease: "circOut" }}
        >
          <ScreenCard className="shadow-xl ring-1 ring-foreground/5" />
        </motion.div>

        {/* Right Card (Faded Background) */}
        <motion.div
          animate={{ y: "0px", rotate: 6, x: "90%" }}
          className="absolute right-[70%] -bottom-12 hidden h-auto w-[75%] opacity-75 blur-[1px] md:block"
          initial={{ y: "60px", rotate: 0, x: "80%" }}
          transition={{ duration: 1, ease: "circOut" }}
        >
          <ScreenCard />
        </motion.div>

        {/* Bottom Fade Gradient */}
        <div className="pointer-events-none absolute bottom-0 left-0 z-40 h-20 w-full bg-linear-to-t from-background via-background/50 to-transparent" />
      </div>
    </section>
  )
}

function ScreenCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative z-20 size-full overflow-hidden rounded-lg border bg-background p-2 *:pointer-events-none *:select-none",
        className
      )}
      {...props}
    >
      <img
        alt="Faiz UI dashboard template in light mode"
        className="z-2 aspect-video rounded-lg border dark:hidden"
        height="auto"
        src="https://storage.efferd.com/screen/dashboard-light.webp"
        width="auto"
      />
      <img
        alt="Faiz UI dashboard template in dark mode"
        className="hidden aspect-video rounded-lg bg-background dark:block"
        height="auto"
        src="https://storage.efferd.com/screen/dashboard-dark.webp"
        width="auto"
      />
    </div>
  )
}
