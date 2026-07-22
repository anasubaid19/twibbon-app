"use client"

import { UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UiKitSection } from "@/components/ui-kit/ui-kit-section"

const chartData = [
  { month: "Jan", desktop: 186 },
  { month: "Feb", desktop: 305 },
  { month: "Mar", desktop: 237 },
  { month: "Apr", desktop: 73 },
  { month: "May", desktop: 209 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const invoices = [
  { invoice: "INV001", status: "Paid", amount: "$250.00" },
  { invoice: "INV002", status: "Pending", amount: "$150.00" },
  { invoice: "INV003", status: "Paid", amount: "$350.00" },
]

export function DataDisplaySection() {
  return (
    <div className="flex flex-col gap-6">
      <UiKitSection
        id="aspect-ratio"
        importPath="@/components/ui/aspect-ratio"
        title="Aspect Ratio"
      >
        <AspectRatio
          className="max-w-sm overflow-hidden rounded-xl bg-muted"
          ratio={16 / 9}
        >
          <div className="flex size-full items-center justify-center text-muted-foreground text-sm">
            16:9
          </div>
        </AspectRatio>
      </UiKitSection>

      <UiKitSection
        id="avatar"
        importPath="@/components/ui/avatar"
        title="Avatar"
      >
        <div className="flex flex-wrap gap-4">
          <Avatar>
            <AvatarImage alt="User" src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
        </div>
      </UiKitSection>

      <UiKitSection id="card" importPath="@/components/ui/card" title="Card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Card content goes here.</p>
          </CardContent>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>
      </UiKitSection>

      <UiKitSection
        id="carousel"
        importPath="@/components/ui/carousel"
        title="Carousel"
      >
        <Carousel className="max-w-xs">
          <CarouselContent>
            {[1, 2, 3].map((slide) => (
              <CarouselItem key={slide}>
                <div className="flex aspect-square items-center justify-center rounded-xl bg-muted">
                  <span className="font-medium text-2xl">{slide}</span>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </UiKitSection>

      <UiKitSection id="chart" importPath="@/components/ui/chart" title="Chart">
        <ChartContainer
          className="min-h-[200px] w-full max-w-md"
          config={chartConfig}
        >
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="month"
              tickLine={false}
              tickMargin={10}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          </BarChart>
        </ChartContainer>
      </UiKitSection>

      <UiKitSection
        id="collapsible"
        importPath="@/components/ui/collapsible"
        title="Collapsible"
      >
        <Collapsible className="max-w-sm">
          <CollapsibleTrigger render={<Button variant="ghost" />}>
            Toggle details
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 text-muted-foreground text-sm">
            Hidden content revealed when expanded.
          </CollapsibleContent>
        </Collapsible>
      </UiKitSection>

      <UiKitSection id="item" importPath="@/components/ui/item" title="Item">
        <ItemGroup className="max-w-md">
          <Item variant="outline">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Profile</ItemTitle>
              <ItemDescription>Manage your account settings.</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </ItemActions>
          </Item>
        </ItemGroup>
      </UiKitSection>

      <UiKitSection
        id="scroll-area"
        importPath="@/components/ui/scroll-area"
        title="Scroll Area"
      >
        <ScrollArea className="h-32 w-48 rounded-xl border p-4">
          <div className="flex flex-col gap-2">
            {Array.from({ length: 12 }, (_, i) => (
              <p className="text-sm" key={i}>
                Scrollable item {i + 1}
              </p>
            ))}
          </div>
        </ScrollArea>
      </UiKitSection>

      <UiKitSection
        id="separator"
        importPath="@/components/ui/separator"
        title="Separator"
      >
        <div className="flex max-w-sm flex-col gap-4">
          <p className="text-sm">Above</p>
          <Separator />
          <p className="text-sm">Below</p>
        </div>
      </UiKitSection>

      <UiKitSection id="table" importPath="@/components/ui/table" title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.invoice}>
                <TableCell className="font-medium">{invoice.invoice}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell className="text-right">{invoice.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </UiKitSection>
    </div>
  )
}
