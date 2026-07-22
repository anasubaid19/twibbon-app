import { Button } from "@/components/ui/button"
import { LinkedinIcon } from "@/components/linkedin-icon"
import { XIcon } from "@/components/x-icon"
import { cn } from "@/lib/utils"

interface TeamMember {
  id: string
  name: string
  role: string
  image: string
  linkedin: string
  x: string
}

const teamMembers: TeamMember[] = [
  {
    id: "ethan",
    name: "Ethan Brooks",
    role: "CEO, Co-founder",
    image: "https://assets.shadcncraft.com/registry/pro-marketing/team/v2/7.webp",
    linkedin: "#",
    x: "#",
  },
  {
    id: "alex",
    name: "Alex Warren",
    role: "CTO, Co-founder",
    image: "https://assets.shadcncraft.com/registry/pro-marketing/team/v2/4.webp",
    linkedin: "#",
    x: "#",
  },
  {
    id: "lucy",
    name: "Lucy Aniston",
    role: "CFO, Co-founder",
    image: "https://assets.shadcncraft.com/registry/pro-marketing/team/v2/6.webp",
    linkedin: "#",
    x: "#",
  },
]

export function TeamSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      {/* Section Header */}
      <div className="mb-12 flex flex-col items-center justify-center gap-3 text-center md:mb-16">
        <span className="text-label text-muted-foreground">
          Our Team
        </span>
        <h2 className="text-display text-foreground">
          The People Behind Faiz UI
        </h2>
        <p className="text-lead text-muted-foreground max-w-2xl">
          A small team of builders, designers, and engineers obsessed with
          crafting components and templates that help you ship better UIs,
          faster.
        </p>
        <div className="pt-2">
          <Button variant="outline" size="sm" className="rounded-full px-5">
            Get in Touch
          </Button>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
        {teamMembers.map((member, index) => (
          <div
            key={member.id}
            className={cn(
              "group relative aspect-[3/4] overflow-hidden rounded-3xl border bg-muted shadow-sm transition-all hover:shadow-md",
              "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards duration-slow ease-entrance",
              index === 0 && "delay-100",
              index === 1 && "delay-200",
              index === 2 && "delay-300"
            )}
          >
            {/* Image */}
            <img
              src={member.image}
              alt={member.name}
              className="size-full object-cover transition-transform duration-slow ease-out group-hover:scale-105"
              loading="lazy"
            />

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

            {/* Content Overlay */}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
              {/* Text Info */}
              <div className="flex flex-col gap-1 text-white">
                <h3 className="text-subtitle font-semibold leading-tight">
                  {member.name}
                </h3>
                <p className="text-caption text-white/70">
                  {member.role}
                </p>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-2">
                <a
                  href={member.linkedin}
                  className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                  aria-label={`${member.name}'s LinkedIn`}
                >
                  <LinkedinIcon className="size-4" />
                </a>
                <a
                  href={member.x}
                  className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                  aria-label={`${member.name}'s X profile`}
                >
                  <XIcon className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
