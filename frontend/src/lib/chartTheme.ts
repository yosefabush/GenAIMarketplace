// Chart theme configuration for Recharts
// Uses CSS variables for dark mode support

export const chartColors = {
  primary: 'var(--primary)',
  accent: 'var(--accent)',
  muted: 'var(--muted)',
  foreground: 'var(--foreground)',
  mutedForeground: 'var(--muted-foreground)',
  border: 'var(--border)',
  background: 'var(--background)',
  card: 'var(--card)',
}

// Type-specific colors for consistency across charts
export const typeColors: Record<string, string> = {
  agent: '#3b82f6',      // blue-500
  prompt: '#22c55e',     // green-500
  mcp: '#a855f7',        // purple-500
  workflow: '#f97316',   // orange-500
  docs: '#14b8a6',       // teal-500
  skill: '#6366f1',      // indigo-500
}

// Fallback color for unknown types
export const defaultTypeColor = '#6b7280'

// Get color for a type with fallback
export function getTypeColor(type: string): string {
  return typeColors[type.toLowerCase()] || defaultTypeColor
}

// Chart tooltip style configuration
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  labelStyle: {
    color: 'var(--foreground)',
    fontWeight: 600,
  },
  itemStyle: {
    color: 'var(--foreground)',
  },
}

// Grid line style
export const gridStyle = {
  stroke: 'var(--border)',
  strokeDasharray: '3 3',
}

// Axis style
export const axisStyle = {
  tick: { fill: 'var(--muted-foreground)' },
  axisLine: { stroke: 'var(--border)' },
}
