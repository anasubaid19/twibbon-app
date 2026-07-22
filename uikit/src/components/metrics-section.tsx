import { ArrowRight02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

interface MetricItem {
  value: string
  label: string
  linkText: string
  href: string
}

const metrics: MetricItem[] = [
  {
    value: "60+",
    label: "Components, ready to copy",
    linkText: "Browse components",
    href: "#",
  },
  {
    value: "20+",
    label: "Production-ready blocks",
    linkText: "View blocks",
    href: "#",
  },
  {
    value: "100%",
    label: "TypeScript, fully typed",
    linkText: "See the code",
    href: "#",
  },
  {
    value: "Lifetime",
    label: "Updates included",
    linkText: "View pricing",
    href: "#",
  },
]

export function MetricsSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left Column: Text & Metrics */}
        <div
          className={cn(
            "flex flex-col items-start justify-start gap-6",
            "fade-in slide-in-from-left-10 animate-in fill-mode-backwards duration-slow ease-entrance"
          )}
        >
          <div className="flex flex-col gap-3">
            <h2 className="text-display text-foreground max-w-md">
              Everything You Need to Ship
            </h2>
            <p className="text-lead text-muted-foreground max-w-xl">
              Faiz UI gives you the components, blocks, and design tokens to go
              from idea to polished interface in minutes — not weeks.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="mt-6 grid w-full grid-cols-2 gap-x-8 gap-y-10">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={cn(
                  "flex flex-col gap-2",
                  "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards duration-slow ease-entrance",
                  index === 0 && "delay-100",
                  index === 1 && "delay-200",
                  index === 2 && "delay-300",
                  index === 3 && "delay-400"
                )}
              >
                <span className="text-title font-semibold text-foreground">
                  {metric.value}
                </span>
                <div className="flex flex-col gap-1.5">
                  <span className="text-caption text-muted-foreground">
                    {metric.label}
                  </span>
                  <a
                    href={metric.href}
                    className="group flex w-fit items-center gap-1 text-label font-medium text-foreground hover:underline"
                  >
                    {metric.linkText}
                    <HugeiconsIcon
                      icon={ArrowRight02Icon}
                      strokeWidth={2}
                      className="size-3.5 transition-transform duration-fast ease-out group-hover:translate-x-0.5"
                    />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Premium Portrait Image */}
        <div
          className={cn(
            "relative aspect-square overflow-hidden rounded-3xl border bg-muted shadow-sm md:aspect-[4/5] lg:aspect-square",
            "fade-in slide-in-from-right-10 animate-in fill-mode-backwards duration-slow ease-entrance delay-200"
          )}
        >
          <img
            src="https://assets.shadcncraft.com/registry/pro-marketing/metrics/3.webp?v=2"
            alt="Developer building an interface with Faiz UI"
            className="size-full object-cover transition-transform duration-slow ease-out hover:scale-102"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}
