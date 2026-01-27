import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Search, Eye, Heart, ChevronDown, ChevronUp } from 'lucide-react'
import type { TopSearchQuery, TopViewedItem, TopLikedItem } from '@/lib/api'

interface TopPerformersCardProps {
  topSearches: TopSearchQuery[]
  topViewed: TopViewedItem[]
  topLiked: TopLikedItem[]
}

// Type badge colors matching the rest of the app
const typeBadgeColors: Record<string, string> = {
  agent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  prompt: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  mcp: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  workflow: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  docs: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  skill: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
}

function TypeBadge({ type }: { type: string }) {
  const colorClass = typeBadgeColors[type.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {type}
    </span>
  )
}

interface ListItemProps {
  rank: number
  title: string
  value: number
  valueLabel: string
  type?: string
  onClick?: () => void
}

function ListItem({ rank, title, value, valueLabel, type, onClick }: ListItemProps) {
  return (
    <div
      className={`flex items-center gap-3 py-2 ${onClick ? 'cursor-pointer hover:bg-[var(--muted)] rounded-md px-2 -mx-2' : ''}`}
      onClick={onClick}
    >
      <span className="w-5 text-sm font-medium text-[var(--muted-foreground)]">#{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{title}</p>
      </div>
      {type && <TypeBadge type={type} />}
      <span className="text-sm text-[var(--muted-foreground)] whitespace-nowrap">
        {value.toLocaleString()} {valueLabel}
      </span>
    </div>
  )
}

export function TopPerformersCard({ topSearches, topViewed, topLiked }: TopPerformersCardProps) {
  const navigate = useNavigate()
  const [expandedTab, setExpandedTab] = useState<string | null>(null)

  const toggleExpanded = (tab: string) => {
    setExpandedTab(expandedTab === tab ? null : tab)
  }

  const renderSearches = () => {
    const items = expandedTab === 'searches' ? topSearches : topSearches.slice(0, 5)
    if (items.length === 0) {
      return <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">No search data available</p>
    }
    return (
      <div className="space-y-1">
        {items.map((item, index) => (
          <ListItem
            key={index}
            rank={index + 1}
            title={item.query || '(empty query)'}
            value={item.count}
            valueLabel="searches"
          />
        ))}
        {topSearches.length > 5 && (
          <button
            onClick={() => toggleExpanded('searches')}
            className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline mt-2 w-full justify-center"
          >
            {expandedTab === 'searches' ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show all {topSearches.length}
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  const renderViewed = () => {
    const items = expandedTab === 'viewed' ? topViewed : topViewed.slice(0, 5)
    if (items.length === 0) {
      return <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">No view data available</p>
    }
    return (
      <div className="space-y-1">
        {items.map((item, index) => (
          <ListItem
            key={item.id}
            rank={index + 1}
            title={item.title}
            value={item.view_count}
            valueLabel="views"
            type={item.type}
            onClick={() => navigate(`/items/${item.id}`)}
          />
        ))}
        {topViewed.length > 5 && (
          <button
            onClick={() => toggleExpanded('viewed')}
            className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline mt-2 w-full justify-center"
          >
            {expandedTab === 'viewed' ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show all {topViewed.length}
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  const renderLiked = () => {
    const items = expandedTab === 'liked' ? topLiked : topLiked.slice(0, 5)
    if (items.length === 0) {
      return <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">No like data available</p>
    }
    return (
      <div className="space-y-1">
        {items.map((item, index) => (
          <ListItem
            key={item.id}
            rank={index + 1}
            title={item.title}
            value={item.like_count}
            valueLabel="likes"
            type={item.type}
            onClick={() => navigate(`/items/${item.id}`)}
          />
        ))}
        {topLiked.length > 5 && (
          <button
            onClick={() => toggleExpanded('liked')}
            className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline mt-2 w-full justify-center"
          >
            {expandedTab === 'liked' ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show all {topLiked.length}
              </>
            )}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
      <h3 className="font-semibold text-[var(--foreground)] mb-4">Top Performers</h3>
      <Tabs defaultValue="searches" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="searches" className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Searches</span>
          </TabsTrigger>
          <TabsTrigger value="viewed" className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Views</span>
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Likes</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="searches">{renderSearches()}</TabsContent>
        <TabsContent value="viewed">{renderViewed()}</TabsContent>
        <TabsContent value="liked">{renderLiked()}</TabsContent>
      </Tabs>
    </div>
  )
}
