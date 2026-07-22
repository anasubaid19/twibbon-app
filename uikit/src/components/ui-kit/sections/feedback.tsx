"use client"

import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { UiKitSection } from "@/components/ui-kit/ui-kit-section"

export function FeedbackSection() {
  return (
    <div className="flex flex-col gap-6">
      <UiKitSection id="alert" importPath="@/components/ui/alert" title="Alert">
        <Alert>
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>
            You can add components to your app using the shadcn CLI.
          </AlertDescription>
        </Alert>
      </UiKitSection>

      <UiKitSection id="empty" importPath="@/components/ui/empty" title="Empty">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No results found</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filters.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline">Clear filters</Button>
          </EmptyContent>
        </Empty>
      </UiKitSection>

      <UiKitSection id="kbd" importPath="@/components/ui/kbd" title="Kbd">
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </UiKitSection>

      <UiKitSection
        id="progress"
        importPath="@/components/ui/progress"
        title="Progress"
      >
        <Progress className="max-w-sm" value={60}>
          <ProgressLabel>Uploading</ProgressLabel>
          <ProgressValue />
        </Progress>
      </UiKitSection>

      <UiKitSection
        id="skeleton"
        importPath="@/components/ui/skeleton"
        title="Skeleton"
      >
        <div className="flex max-w-sm flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="size-12 rounded-full" />
        </div>
      </UiKitSection>

      <UiKitSection
        id="spinner"
        importPath="@/components/ui/spinner"
        title="Spinner"
      >
        <Spinner />
      </UiKitSection>

      <UiKitSection
        id="sonner"
        importPath="@/components/ui/sonner"
        title="Sonner"
      >
        <Button
          onClick={() =>
            toast("Event has been created", {
              description: "Monday, January 3rd at 6:00pm",
            })
          }
          variant="outline"
        >
          Show toast
        </Button>
      </UiKitSection>
    </div>
  )
}
