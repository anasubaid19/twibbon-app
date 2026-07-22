import {
  Building01Icon,
  CheckmarkCircle01Icon,
  StarIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface PricingPlan {
  id: string
  title: string
  description: string
  price: string
  period: string
  taxInfo: string
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  features: string[]
}

const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    title: "Personal",
    description: "For solo developers shipping their own projects.",
    price: "$49",
    period: "One-time",
    taxInfo: "Plus local taxes",
    icon: StarIcon,
    features: [
      "60+ shadcn/ui components",
      "20+ ready-made blocks",
      "Light & dark themes",
      "Lifetime updates",
      "Single project license",
    ],
  },
  {
    id: "pro",
    title: "Team",
    description: "For teams building multiple products together.",
    price: "$149",
    period: "One-time",
    taxInfo: "Plus local taxes",
    icon: UserGroupIcon,
    features: [
      "Everything in Personal",
      "Unlimited projects",
      "Figma design files",
      "Up to 10 seats",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    title: "Enterprise",
    description: "For organizations that need more control and support.",
    price: "Custom",
    period: "Annual",
    taxInfo: "Billed yearly",
    icon: Building01Icon,
    features: [
      "Everything in Team",
      "Unlimited seats",
      "Custom component requests",
      "Dedicated support channel",
      "Onboarding & training",
    ],
  },
]

export function PricingSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      {/* Section Header */}
      <div className="mb-12 flex flex-col items-start justify-start gap-2 md:mb-16">
        <span className="text-label text-muted-foreground uppercase tracking-wider">
          Pricing
        </span>
        <h2 className="text-display text-foreground">
          Simple Pricing, One-Time Payment
        </h2>
        <p className="text-lead text-muted-foreground max-w-2xl">
          Pay once, build forever. Every Faiz UI license includes lifetime
          updates.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {pricingPlans.map((plan, index) => (
          <Card
            key={plan.id}
            className={cn(
              "relative flex flex-col border bg-card p-6 shadow-sm transition-all hover:shadow-md",
              "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards duration-slow ease-entrance",
              index === 0 && "delay-100",
              index === 1 && "delay-200",
              index === 2 && "delay-300"
            )}
          >
            <CardContent className="flex flex-1 flex-col p-0">
              {/* Icon & Title */}
              <div className="mb-6 flex flex-col items-start gap-4">
                <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground">
                  <HugeiconsIcon icon={plan.icon} strokeWidth={2} className="size-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-subtitle font-semibold text-foreground">
                    {plan.title}
                  </h3>
                  <p className="text-caption text-muted-foreground min-h-[40px]">
                    {plan.description}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 flex items-center gap-3">
                <span className="text-display font-semibold text-foreground">
                  {plan.price}
                </span>
                <div className="flex flex-col">
                  <span className="text-label font-medium text-foreground">
                    {plan.period}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {plan.taxInfo}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button className="mb-8 w-full" size="lg">
                Get started
              </Button>

              {/* Features List */}
              <div className="flex flex-col gap-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      strokeWidth={2}
                      className="size-5 shrink-0 text-muted-foreground/60"
                    />
                    <span className="text-label text-muted-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
