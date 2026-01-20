import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table'
import {
  api,
  type AnalyticsOverview,
  type TopSearchQuery,
  type TopViewedItem,
  type ItemsByType,
} from '@/lib/api'
import {
  BarChart3,
  LayoutDashboard,
  Loader2,
  Download,
  Search,
  Eye,
  Calendar,
} from 'lucide-react'

// Type badge colors
const typeBadgeColors: Record<string, string> = {
  agent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  prompt: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  mcp: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  workflow: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  docs: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
}

// Chart bar colors for types
const typeBarColors: Record<string, string> = {
  agent: 'bg-blue-500',
  prompt: 'bg-green-500',
  mcp: 'bg-purple-500',
  workflow: 'bg-orange-500',
  docs: 'bg-gray-500',
}

// Card component for analytics sections
function StatCard({ title, value, subtitle }: { title: string; value: number | string; subtitle?: string }) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
      <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">{title}</h3>
      <p className="text-3xl font-bold text-[var(--foreground)]">{value.toLocaleString()}</p>
      {subtitle && (
        <p className="text-sm text-[var(--muted-foreground)] mt-1">{subtitle}</p>
      )}
    </div>
  )
}

// Simple bar chart component
function BarChart({
  data,
  labelKey,
  valueKey,
  colorKey,
  maxValue,
}: {
  data: Array<Record<string, string | number>>
  labelKey: string
  valueKey: string
  colorKey?: string
  maxValue?: number
}) {
  const max = maxValue || Math.max(...data.map(d => Number(d[valueKey])), 1)

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const value = Number(item[valueKey])
        const percentage = (value / max) * 100
        const barColor = colorKey && typeBarColors[item[colorKey] as string]
          ? typeBarColors[item[colorKey] as string]
          : 'bg-[var(--primary)]'

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--foreground)] truncate max-w-[200px]">
                {item[labelKey]}
              </span>
              <span className="text-[var(--muted-foreground)] font-medium ml-2">
                {value.toLocaleString()}
              </span>
            </div>
            <div className="h-4 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Pie chart component (simplified as a horizontal bar)
function PieChart({ data }: { data: ItemsByType[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  if (total === 0) {
    return (
      <p className="text-[var(--muted-foreground)] text-center py-8">No data available</p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="h-8 flex rounded-full overflow-hidden">
        {data.map((item, index) => {
          const percentage = (item.count / total) * 100
          const barColor = typeBarColors[item.type] || 'bg-gray-500'
          return (
            <div
              key={index}
              className={`${barColor} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
              title={`${item.type}: ${item.count} (${percentage.toFixed(1)}%)`}
            />
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {data.map((item, index) => {
          const percentage = ((item.count / total) * 100).toFixed(1)
          const barColor = typeBarColors[item.type] || 'bg-gray-500'
          return (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${barColor}`} />
              <span className="text-sm text-[var(--foreground)]">
                {item.type}: {item.count} ({percentage}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Generate CSV content from analytics data
function generateCSV(analytics: AnalyticsOverview): string {
  const lines: string[] = []

  // Search Totals
  lines.push('Search Totals')
  lines.push('Period,Count')
  lines.push(`Last 7 Days,${analytics.search_totals.last_7_days}`)
  lines.push(`Last 30 Days,${analytics.search_totals.last_30_days}`)
  lines.push(`All Time,${analytics.search_totals.all_time}`)
  lines.push('')

  // Top Search Queries
  lines.push('Top Search Queries')
  lines.push('Query,Count,Avg Results')
  analytics.top_searches.forEach(q => {
    // Escape quotes in query
    const escapedQuery = q.query.replace(/"/g, '""')
    lines.push(`"${escapedQuery}",${q.count},${q.avg_result_count}`)
  })
  lines.push('')

  // Searches by Source
  lines.push('Searches by Source')
  lines.push('Source,Count')
  analytics.searches_by_source.forEach(s => {
    lines.push(`${s.source},${s.count}`)
  })
  lines.push('')

  // Items by Type
  lines.push('Items by Type')
  lines.push('Type,Count')
  analytics.items_by_type.forEach(t => {
    lines.push(`${t.type},${t.count}`)
  })
  lines.push('')

  // Top Viewed Items
  lines.push('Top Viewed Items')
  lines.push('Title,Type,Views')
  analytics.top_viewed_items.forEach(i => {
    const escapedTitle = i.title.replace(/"/g, '""')
    lines.push(`"${escapedTitle}",${i.type},${i.view_count}`)
  })

  return lines.join('\n')
}

export default function AdminAnalytics() {
  const navigate = useNavigate()

  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Date range filter
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: { start_date?: string; end_date?: string } = {}
      if (startDate) params.start_date = new Date(startDate).toISOString()
      if (endDate) params.end_date = new Date(endDate).toISOString()

      const response = await api.getAnalytics(params)
      setAnalytics(response.data.data)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleExportCSV = () => {
    if (!analytics) return

    const csv = generateCSV(analytics)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    const filename = `analytics_${new Date().toISOString().split('T')[0]}.csv`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDateFilter = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAnalytics()
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-[var(--primary)]" />
              <h1 className="text-lg font-semibold text-[var(--foreground)]">
                Analytics Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter and Export */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <form onSubmit={handleDateFilter} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
                placeholder="Start date"
              />
              <span className="text-[var(--muted-foreground)]">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
                placeholder="End date"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Apply Filter
            </Button>
            {(startDate || endDate) && (
              <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </form>

          <Button onClick={handleExportCSV} disabled={!analytics || loading}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-[var(--destructive)]">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchAnalytics()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Analytics Content */}
        {!loading && !error && analytics && (
          <div className="space-y-8">
            {/* Search Totals */}
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Statistics
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title="Last 7 Days"
                  value={analytics.search_totals.last_7_days}
                  subtitle="searches"
                />
                <StatCard
                  title="Last 30 Days"
                  value={analytics.search_totals.last_30_days}
                  subtitle="searches"
                />
                <StatCard
                  title="All Time"
                  value={analytics.search_totals.all_time}
                  subtitle="total searches"
                />
              </div>
            </section>

            {/* Two-column layout for charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Search Queries */}
              <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Top 10 Search Queries
                </h2>
                {analytics.top_searches.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Query</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Avg Results</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.top_searches.map((query: TopSearchQuery, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {query.query || '(empty query)'}
                            </TableCell>
                            <TableCell className="text-right">
                              {query.count.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {query.avg_result_count.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-[var(--muted-foreground)] text-center py-8">
                    No search data available
                  </p>
                )}
              </section>

              {/* Searches by Source */}
              <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                  Searches by Source
                </h2>
                {analytics.searches_by_source.length > 0 ? (
                  <BarChart
                    data={analytics.searches_by_source as unknown as Array<Record<string, string | number>>}
                    labelKey="source"
                    valueKey="count"
                  />
                ) : (
                  <p className="text-[var(--muted-foreground)] text-center py-8">
                    No source data available
                  </p>
                )}
              </section>
            </div>

            {/* Items by Type */}
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Items by Type
              </h2>
              <PieChart data={analytics.items_by_type} />
            </section>

            {/* Top Viewed Items */}
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Top 10 Most Viewed Items
              </h2>
              {analytics.top_viewed_items.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.top_viewed_items.map((item: TopViewedItem) => (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer hover:bg-[var(--muted)]"
                          onClick={() => navigate(`/items/${item.id}`)}
                        >
                          <TableCell className="font-medium max-w-[300px] truncate">
                            {item.title}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeBadgeColors[item.type] || 'bg-gray-100 text-gray-800'}`}>
                              {item.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.view_count.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-[var(--muted-foreground)] text-center py-8">
                  No items to display
                </p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
