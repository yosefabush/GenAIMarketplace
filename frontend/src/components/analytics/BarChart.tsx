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

interface BarChartProps {
  data: Array<{ label: string; value: number; type?: string }>
  height?: number
  color?: string
  textColor?: string
  showValues?: boolean
  maxItems?: number
}

export function HorizontalBarChart({
  data,
  height = 250,
  color = 'var(--primary)',
  textColor = 'var(--muted-foreground)',
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

  const chartData = data.slice(0, maxItems).map(item => ({
    ...item,
    fill: item.type ? getTypeColor(item.type) : color,
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
