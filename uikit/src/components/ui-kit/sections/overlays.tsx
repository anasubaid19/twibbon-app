"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UiKitSection } from "@/components/ui-kit/ui-kit-section"

export function OverlaysSection() {
  const [commandOpen, setCommandOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <UiKitSection
        id="command"
        importPath="@/components/ui/command"
        title="Command"
      >
        <div className="flex flex-col gap-3">
          <Button onClick={() => setCommandOpen(true)} variant="outline">
            Open command palette
          </Button>
          <CommandDialog onOpenChange={setCommandOpen} open={commandOpen}>
            <Command>
              <CommandInput placeholder="Type a command..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>Calendar</CommandItem>
                  <CommandItem>Search</CommandItem>
                  <CommandItem>Settings</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </CommandDialog>
        </div>
      </UiKitSection>

      <UiKitSection
        id="context-menu"
        importPath="@/components/ui/context-menu"
        title="Context Menu"
      >
        <ContextMenu>
          <ContextMenuTrigger className="flex h-24 w-full max-w-sm items-center justify-center rounded-xl border border-dashed text-muted-foreground text-sm">
            Right click here
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuItem>Back</ContextMenuItem>
              <ContextMenuItem>Forward</ContextMenuItem>
              <ContextMenuItem>Reload</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      </UiKitSection>

      <UiKitSection
        id="dialog"
        importPath="@/components/ui/dialog"
        title="Dialog"
      >
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>
            Open dialog
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </UiKitSection>

      <UiKitSection
        id="drawer"
        importPath="@/components/ui/drawer"
        title="Drawer"
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer title</DrawerTitle>
              <DrawerDescription>
                Drawer description goes here.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </UiKitSection>

      <UiKitSection
        id="dropdown-menu"
        importPath="@/components/ui/dropdown-menu"
        title="Dropdown Menu"
      >
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            Open menu
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </UiKitSection>

      <UiKitSection
        id="hover-card"
        importPath="@/components/ui/hover-card"
        title="Hover Card"
      >
        <HoverCard>
          <HoverCardTrigger render={<Button variant="link" />}>
            @faiz
          </HoverCardTrigger>
          <HoverCardContent>
            <p className="text-sm">
              The open source component registry for modern apps.
            </p>
          </HoverCardContent>
        </HoverCard>
      </UiKitSection>

      <UiKitSection
        id="popover"
        importPath="@/components/ui/popover"
        title="Popover"
      >
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            Open popover
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Dimensions</PopoverTitle>
              <PopoverDescription>
                Set the dimensions for the layer.
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </UiKitSection>

      <UiKitSection id="sheet" importPath="@/components/ui/sheet" title="Sheet">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>
            Open sheet
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>
                Make changes to your profile here.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </UiKitSection>

      <UiKitSection
        id="tooltip"
        importPath="@/components/ui/tooltip"
        title="Tooltip"
      >
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>
            Hover me
          </TooltipTrigger>
          <TooltipContent>Add to library</TooltipContent>
        </Tooltip>
      </UiKitSection>
    </div>
  )
}
