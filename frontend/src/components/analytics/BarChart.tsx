import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getTypeColor } from '@/lib/chartTheme'

const barPalette = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f97316', // orange
  '#a855f7', // purple
  '#ef4444', // red
  '#14b8a6', // teal
  '#eab308', // yellow
  '#ec4899', // pink
  '#6366f1', // indigo
  '#06b6d4', // cyan
]

interface BarChartProps {
  data: Array<{ label: string; value: number; type?: string }>
  height?: number
  color?: string
  colorful?: boolean
  textColor?: string
  showValues?: boolean
  maxItems?: number
}

export function HorizontalBarChart({
  data,
  height = 250,
  color = 'var(--primary)',
  colorful = false,
  textColor = '#9ca3af',
  showValues = true,
  maxItems = 10,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[var(--muted-foreground)]"
        style={{ height }}
      >
        No data available
      </div>
    )
  }

  const chartData = data.slice(0, maxItems).map((item, index) => ({
    ...item,
    fill: item.type ? getTypeColor(item.type) : colorful ? barPalette[index % barPalette.length] : color,
  }))

  // Calculate dynamic height based on number of items
  const dynamicHeight = Math.max(height, chartData.length * 36)

  return (
    <div style={{ height: dynamicHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: showValues ? 60 : 10, left: 10, bottom: 5 }}
        >
          <XAxis
            type="number"
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={100}
            tickFormatter={(value) =>
              value.length > 15 ? `${value.slice(0, 15)}...` : value
            }
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-lg">
                    <p className="font-medium text-[var(--foreground)] max-w-[200px] break-words">
                      {data.label}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {data.value.toLocaleString()}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            label={
              showValues
                ? {
                    position: 'right' as const,
                    fill: textColor,
                    fontSize: 11,
                    formatter: (value: unknown) =>
                      typeof value === 'number' ? value.toLocaleString() : String(value),
                  }
                : false
            }
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
