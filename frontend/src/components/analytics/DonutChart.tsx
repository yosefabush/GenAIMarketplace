import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { getTypeColor } from '@/lib/chartTheme'

interface DonutChartProps {
  data: { type: string; count: number }[]
  height?: number
}

export function DonutChart({ data, height = 200 }: DonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[var(--muted-foreground)]">
        No data available
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.count, 0)
  const chartData = data.map(item => ({
    name: item.type,
    value: item.count,
    color: getTypeColor(item.type),
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                const percentage = ((data.value / total) * 100).toFixed(1)
                return (
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-lg">
                    <p className="font-medium text-[var(--foreground)]">{data.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {data.value.toLocaleString()} ({percentage}%)
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend
            content={({ payload }) => (
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {payload?.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-[var(--foreground)]">{entry.value}</span>
                  </div>
                ))}
              </div>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
