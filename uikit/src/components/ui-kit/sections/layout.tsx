"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DirectionProvider } from "@/components/ui/direction"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { UiKitSection } from "@/components/ui-kit/ui-kit-section"

export function LayoutSection() {
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr")

  return (
    <div className="flex flex-col gap-6">
      <UiKitSection
        id="direction"
        importPath="@/components/ui/direction"
        title="Direction"
      >
        <div className="flex flex-col gap-4">
          <Button
            className="w-fit"
            onClick={() =>
              setDir((current) => (current === "ltr" ? "rtl" : "ltr"))
            }
            variant="outline"
          >
            Toggle direction ({dir})
          </Button>
          <DirectionProvider direction={dir}>
            <div className="max-w-sm rounded-xl border p-4 text-sm">
              Text flows {dir === "ltr" ? "left to right" : "right to left"}.
            </div>
          </DirectionProvider>
        </div>
      </UiKitSection>

      <UiKitSection
        id="resizable"
        importPath="@/components/ui/resizable"
        title="Resizable"
      >
        <ResizablePanelGroup
          className="min-h-[160px] max-w-md rounded-xl border"
          orientation="horizontal"
        >
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-4 text-sm">
              Panel A
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-4 text-sm">
              Panel B
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </UiKitSection>
    </div>
  )
}
