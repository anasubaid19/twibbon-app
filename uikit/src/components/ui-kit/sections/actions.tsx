"use client"

import {
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { UiKitSection } from "@/components/ui-kit/ui-kit-section"

const buttonVariants = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const

const buttonSizes = ["xs", "sm", "default", "lg"] as const

const badgeVariants = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const

export function ActionsSection() {
  return (
    <div className="flex flex-col gap-6">
      <UiKitSection
        id="accordion"
        importPath="@/components/ui/accordion"
        title="Accordion"
      >
        <Accordion className="max-w-md" defaultValue={["item-1"]}>
          <AccordionItem value="item-1">
            <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>
              Yes. It uses Base UI primitives with proper ARIA attributes.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Is it styled?</AccordionTrigger>
            <AccordionContent>
              Yes. It matches the rest of the design system.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </UiKitSection>

      <UiKitSection
        id="alert-dialog"
        importPath="@/components/ui/alert-dialog"
        title="Alert Dialog"
      >
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="outline" />}>
            Show alert dialog
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </UiKitSection>

      <UiKitSection id="badge" importPath="@/components/ui/badge" title="Badge">
        <div className="flex flex-wrap gap-2">
          {badgeVariants.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </UiKitSection>

      <UiKitSection
        id="button"
        importPath="@/components/ui/button"
        title="Button"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="font-medium text-sm">Variants</p>
            <div className="flex flex-wrap gap-2">
              {buttonVariants.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium text-sm">Sizes</p>
            <div className="flex flex-wrap items-center gap-2">
              {buttonSizes.map((size) => (
                <Button key={size} size={size}>
                  {size}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </UiKitSection>

      <UiKitSection
        id="button-group"
        importPath="@/components/ui/button-group"
        title="Button Group"
      >
        <ButtonGroup>
          <Button variant="outline">Left</Button>
          <ButtonGroupText>or</ButtonGroupText>
          <Button variant="outline">Right</Button>
        </ButtonGroup>
      </UiKitSection>

      <UiKitSection
        id="toggle"
        importPath="@/components/ui/toggle"
        title="Toggle"
      >
        <Toggle aria-label="Toggle bold">
          <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />
        </Toggle>
      </UiKitSection>

      <UiKitSection
        id="toggle-group"
        importPath="@/components/ui/toggle-group"
        title="Toggle Group"
      >
        <ToggleGroup defaultValue={["bold"]} multiple>
          <ToggleGroupItem aria-label="Toggle bold" value="bold">
            <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Toggle italic" value="italic">
            <HugeiconsIcon icon={TextItalicIcon} strokeWidth={2} />
          </ToggleGroupItem>
          <ToggleGroupItem aria-label="Toggle underline" value="underline">
            <HugeiconsIcon icon={TextUnderlineIcon} strokeWidth={2} />
          </ToggleGroupItem>
        </ToggleGroup>
      </UiKitSection>
    </div>
  )
}
