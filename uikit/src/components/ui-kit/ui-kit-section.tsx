import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type UiKitSectionProps = {
  id: string
  title: string
  importPath: string
  children: React.ReactNode
  className?: string
  description?: string
}

export function UiKitSection({
  id,
  title,
  importPath,
  children,
  className,
  description,
}: UiKitSectionProps) {
  return (
    <section className="scroll-mt-24" id={id}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description ?? <code className="text-xs">{importPath}</code>}
          </CardDescription>
        </CardHeader>
        <CardContent className={cn("flex flex-col gap-4", className)}>
          {children}
        </CardContent>
      </Card>
    </section>
  )
}
