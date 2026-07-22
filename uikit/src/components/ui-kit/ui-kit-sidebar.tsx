"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { catalogCategories } from "@/components/ui-kit/catalog"
import { cn } from "@/lib/utils"

type UiKitSidebarProps = {
  className?: string
}

export function UiKitSidebar({ className }: UiKitSidebarProps) {
  return (
    <ScrollArea className={cn("h-[calc(100svh-10rem)]", className)}>
      <nav aria-label="UI kit sections" className="flex flex-col gap-6 pr-3">
        {catalogCategories.map((category) => (
          <div className="flex flex-col gap-2" key={category.id}>
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              {category.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {category.items.map((item) => (
                <li key={item.id}>
                  <a
                    className="block rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    href={`#${item.id}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </ScrollArea>
  )
}
