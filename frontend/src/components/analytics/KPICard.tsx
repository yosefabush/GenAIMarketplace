import { type LucideIcon } from 'lucide-react'

interface MetricRow {
  label: string
  value: number
}

interface KPICardProps {
  title: string
  icon: LucideIcon
  iconColor?: string
  metrics: MetricRow[]
}

export function KPICard({ title, icon: Icon, iconColor, metrics }: KPICardProps) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${iconColor || 'text-[var(--primary)]'}`} />
        <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
      </div>
      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">{metric.label}</span>
            <span className="text-lg font-semibold text-[var(--foreground)]">
              {metric.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
