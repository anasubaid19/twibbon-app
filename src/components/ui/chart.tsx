import { type ReactElement, useCallback, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function ChartContainer({ children, className }: { children: ReactElement; className?: string }) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}

type ChartTooltipContentProps = {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function ChartTooltipContent({ active, payload, label }: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground">{item.name}:</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

type LineChartProps = {
  data: Record<string, unknown>[]
  lines: Array<{ key: string; color: string; name: string }>
  xKey: string
  title?: string
}

function AnalyticsChart({ data, lines, xKey, title }: LineChartProps) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({})

  const toggleLine = useCallback((key: string) => {
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-3">
          {lines.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => toggleLine(l.key)}
              className={`flex items-center gap-1.5 text-xs transition-opacity ${
                hidden[l.key] ? "opacity-40" : "opacity-100"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
              {l.name}
            </button>
          ))}
        </div>
        <ChartContainer>
          <ReLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltipContent />} />
            {lines.map((l) =>
              hidden[l.key] ? null : (
                <Line
                  key={l.key}
                  type="monotone"
                  dataKey={l.key}
                  name={l.name}
                  stroke={l.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ),
            )}
          </ReLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export { AnalyticsChart, ChartContainer, ChartTooltipContent }
