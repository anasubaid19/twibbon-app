"use client"
import {
  ArrowRight01Icon,
  CodeIcon,
  Layers01Icon,
  PaintBoardIcon,
  TextFontIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { FacebookIcon } from "@/components/facebook-icon"
import { LinkedinIcon } from "@/components/linkedin-icon"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { XIcon } from "@/components/x-icon"
import { YoutubeIcon } from "@/components/youtube-icon"
import { cn } from "@/lib/utils"

export function HeaderMenu() {
  const [open, setOpen] = useState(false)

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-controls="mobile-menu"
            aria-expanded={open}
            aria-label="Toggle menu"
            className="gap-1.5 rounded-full px-3"
            size="lg"
            style={{
              // @ts-expect-error
              cornerShape: "squircle",
            }}
          />
        }
      >
        <span className="w-10 text-start">{open ? "Close" : "Menu"}</span>
        <div className="relative size-4 translate-y-px">
          <span
            className={cn(
              "absolute size-1 rounded-full bg-primary-foreground transition-all duration-200",
              open
                ? "top-1.5 -left-px h-0.5 w-4 -rotate-45"
                : "top-0.5 left-1.5"
            )}
          />
          <span
            className={cn(
              "absolute size-1 rounded-full bg-primary-foreground transition-all duration-200",
              open ? "top-1.5 -left-px h-0.5 w-4 rotate-45" : "top-2 left-1.5"
            )}
          />
        </div>
        <span className="sr-only">Toggle Menu</span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="-mr-2 w-[92svw] gap-0 overflow-hidden p-0 md:w-48"
        sideOffset={12}
      >
        <ul className="grid grid-cols-1 border-b bg-background p-2">
          {linkItems.map((item) => (
            <li className="w-full" key={item.label}>
              <a
                className="rounded-3xl group flex w-full items-center justify-between px-3 py-2 font-medium hover:bg-muted active:bg-muted dark:hover:bg-muted/50"
                href={item.href}
              >
                <div className="flex items-center gap-2">
                  <div className="[&>svg]:size-4 [&>svg]:text-primary/80">
                    {item.icon}
                  </div>
                  <p className="text-label">{item.label}</p>
                </div>
                <div className="relative ml-auto flex h-full w-4 items-center">
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="size-4 opacity-50 transition-all group-hover:translate-x-0 group-hover:opacity-50 md:-translate-x-2 md:opacity-0"
                  />
                </div>
              </a>
            </li>
          ))}
        </ul>
        <div className="flex justify-center gap-x-2 p-2">
          {socialLinks.map((item, index) => (
            <Button
              className="[&>svg]:text-primary/80"
              key={`social-${item.link}-${index}`}
              size="icon-sm"
              variant="outline"
              render={<a href={item.link} target="_blank" rel="noopener" />}
              nativeButton={false}
            >
              {item.icon}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const linkItems = [
  {
    label: "Components",
    href: "#",
    icon: <HugeiconsIcon icon={Layers01Icon} strokeWidth={2} />,
  },
  {
    label: "Templates",
    href: "#",
    icon: <HugeiconsIcon icon={PaintBoardIcon} strokeWidth={2} />,
  },
  {
    label: "Documentation",
    href: "#",
    icon: <HugeiconsIcon icon={TextFontIcon} strokeWidth={2} />,
  },
  {
    label: "Changelog",
    href: "#",
    icon: <HugeiconsIcon icon={CodeIcon} strokeWidth={2} />,
  },
]

const socialLinks = [
  {
    icon: <FacebookIcon />,
    link: "#",
  },
  {
    icon: <LinkedinIcon />,
    link: "#",
  },
  {
    icon: <XIcon />,
    link: "#",
  },
  {
    icon: <YoutubeIcon />,
    link: "#",
  },
]
