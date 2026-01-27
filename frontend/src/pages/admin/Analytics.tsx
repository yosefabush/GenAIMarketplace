import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  DonutChart,
  AreaChart,
  HorizontalBarChart,
  KPICard,
  TopPerformersCard,
} from '@/components/analytics'
import {
  api,
  type AnalyticsOverview,
  type LikeAnalytics,
} from '@/lib/api'
import {
  BarChart3,
  LayoutDashboard,
  Loader2,
  Download,
  Search,
  Calendar,
  Heart,
  PieChart,
} from 'lucide-react'

// Generate CSV content from analytics data
function generateCSV(analytics: AnalyticsOverview, likeAnalytics: LikeAnalytics | null): string {
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
  lines.push('')

  // Like Analytics (if available)
  if (likeAnalytics) {
    lines.push('Like Totals')
    lines.push('Period,Count')
    lines.push(`Last 7 Days,${likeAnalytics.totals.last_7_days}`)
    lines.push(`Last 30 Days,${likeAnalytics.totals.last_30_days}`)
    lines.push(`Total Likes,${likeAnalytics.totals.total_likes}`)
    lines.push('')

    lines.push('Top Liked Items')
    lines.push('Title,Type,Likes')
    likeAnalytics.top_liked_items.forEach(i => {
      const escapedTitle = i.title.replace(/"/g, '""')
      lines.push(`"${escapedTitle}",${i.type},${i.like_count}`)
    })
    lines.push('')

    lines.push('Likes Over Time')
    lines.push('Date,Count')
    likeAnalytics.likes_over_time.forEach(l => {
      lines.push(`${l.date},${l.count}`)
    })
  }

  return lines.join('\n')
}

export default function AdminAnalytics() {
  const navigate = useNavigate()

  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [likeAnalytics, setLikeAnalytics] = useState<LikeAnalytics | null>(null)
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

      // Fetch both analytics and like analytics in parallel
      const [analyticsResponse, likeAnalyticsResponse] = await Promise.all([
        api.getAnalytics(params),
        api.getLikeAnalytics(params),
      ])
      setAnalytics(analyticsResponse.data.data)
      setLikeAnalytics(likeAnalyticsResponse.data.data)
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

    const csv = generateCSV(analytics, likeAnalytics)
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Date Range Filter and Export */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <form onSubmit={handleDateFilter} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36"
                placeholder="Start date"
              />
              <span className="text-[var(--muted-foreground)]">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36"
                placeholder="End date"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Apply
            </Button>
            {(startDate || endDate) && (
              <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </form>

          <Button onClick={handleExportCSV} disabled={!analytics || loading} size="sm">
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
          <div className="space-y-6">
            {/* ROW 1: KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard
                title="Searches"
                icon={Search}
                metrics={[
                  { label: 'Last 7 days', value: analytics.search_totals.last_7_days },
                  { label: 'Last 30 days', value: analytics.search_totals.last_30_days },
                  { label: 'All time', value: analytics.search_totals.all_time },
                ]}
              />
              <KPICard
                title="Likes"
                icon={Heart}
                iconColor="text-red-500"
                metrics={
                  likeAnalytics
                    ? [
                        { label: 'Last 7 days', value: likeAnalytics.totals.last_7_days },
                        { label: 'Last 30 days', value: likeAnalytics.totals.last_30_days },
                        { label: 'All time', value: likeAnalytics.totals.total_likes },
                      ]
                    : [
                        { label: 'Last 7 days', value: 0 },
                        { label: 'Last 30 days', value: 0 },
                        { label: 'All time', value: 0 },
                      ]
                }
              />
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="font-semibold text-[var(--foreground)]">Items by Type</h3>
                </div>
                <DonutChart data={analytics.items_by_type} height={160} />
              </div>
            </div>

            {/* ROW 2: Time Series + Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-[var(--foreground)]">Likes Over Time</h3>
                </div>
                <AreaChart
                  data={likeAnalytics?.likes_over_time || []}
                  height={220}
                  color="#ef4444"
                  gradientId="likesGradient"
                />
              </div>
              <TopPerformersCard
                topSearches={analytics.top_searches}
                topViewed={analytics.top_viewed_items}
                topLiked={likeAnalytics?.top_liked_items || []}
              />
            </div>

            {/* ROW 3: Bar Chart */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">Top Search Queries</h3>
              <HorizontalBarChart
                data={analytics.top_searches.map(q => ({
                  label: q.query || '(empty)',
                  value: q.count,
                }))}
                height={220}
                maxItems={7}
                color="#3b82f6"
                textColor="#9ca3af"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
