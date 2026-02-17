import { useState, useEffect, useRef } from "react"
import { useParams, Link, useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Eye, Calendar, Tag, Folder, Clock } from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import { api, type Item, type ItemType } from "@/lib/api"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function getFullImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}
import { cn } from "@/lib/utils"
import { CodeBlock, InlineCode } from "@/components/CodeBlock"
import { RelatedItems } from "@/components/RelatedItems"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LikeButton } from "@/components/LikeButton"
import { useItemTypes } from "@/hooks/useItemTypes"

// Color mapping from color name to Tailwind classes (light/dark variants)
const colorClasses: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
}

// Fallback colors for legacy type names (when itemTypes not provided)
const fallbackTypeColors: Record<string, string> = {
  agent: colorClasses.blue,
  prompt: colorClasses.green,
  mcp: colorClasses.purple,
  workflow: colorClasses.orange,
  docs: colorClasses.gray,
  skill: colorClasses.indigo,
}

function getTypeBadgeClass(type: string, itemTypes?: ItemType[]): string {
  // If itemTypes provided, look up the color from the matching type
  if (itemTypes && itemTypes.length > 0) {
    const itemType = itemTypes.find(
      (t) => t.slug.toLowerCase() === type.toLowerCase() || t.name.toLowerCase() === type.toLowerCase()
    )
    if (itemType?.color) {
      return colorClasses[itemType.color] || colorClasses.gray
    }
  }
  // Fallback to legacy hardcoded colors
  return fallbackTypeColors[type.toLowerCase()] || colorClasses.gray
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function parseItemId(id: string | undefined): number | null {
  if (!id) return null
  const parsed = parseInt(id, 10)
  return isNaN(parsed) ? null : parsed
}

// Custom components for ReactMarkdown with syntax highlighting
const markdownComponents: Components = {
  code({ className, children, ...props }) {
    // Check if this is a code block (has language class) or inline code
    const match = /language-(\w+)/.exec(className || "")
    const isCodeBlock = match || (typeof children === "string" && children.includes("\n"))

    if (isCodeBlock) {
      const language = match ? match[1] : undefined
      const codeString = String(children).replace(/\n$/, "")
      return <CodeBlock language={language}>{codeString}</CodeBlock>
    }

    // Inline code
    return <InlineCode {...props}>{children}</InlineCode>
  },
  pre({ children }) {
    // Render pre content directly (CodeBlock handles its own styling)
    return <>{children}</>
  },
}

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="text-6xl font-bold text-muted-foreground mb-4">404</div>
          <h1 className="text-2xl font-semibold text-card-foreground mb-2">
            Item Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The item you're looking for doesn't exist or may have been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

function LoadingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-muted rounded mb-6" />
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="h-8 w-3/4 bg-muted rounded mb-4" />
            <div className="h-4 w-full bg-muted rounded mb-2" />
            <div className="h-4 w-5/6 bg-muted rounded mb-2" />
            <div className="h-4 w-4/6 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ErrorPage({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    </div>
  )
}

interface ItemDetailContentProps {
  itemId: number
}

function ItemDetailContent({ itemId }: ItemDetailContentProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const viewCountIncrementedRef = useRef(false)
  const { itemTypes } = useItemTypes()

  useEffect(() => {
    let cancelled = false

    async function fetchItem() {
      try {
        const response = await api.getItem(itemId)
        if (!cancelled) {
          if (response.data.success) {
            setItem(response.data.data)
          } else {
            setNotFound(true)
          }
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          if ((err as { response?: { status?: number } }).response?.status === 404) {
            setNotFound(true)
          } else {
            setError("Failed to load item")
          }
          setLoading(false)
        }
      }
    }

    fetchItem()

    return () => {
      cancelled = true
    }
  }, [itemId])

  // Increment view count on page load (once per itemId)
  useEffect(() => {
    if (viewCountIncrementedRef.current) return

    async function incrementView() {
      try {
        await api.incrementViewCount(itemId)
        viewCountIncrementedRef.current = true
      } catch (err) {
        // Silently fail - view count is not critical
        console.error("Failed to increment view count:", err)
      }
    }

    incrementView()
  }, [itemId])

  const handleBack = () => {
    const state = location.state as { from?: string } | undefined
    if (state?.from) {
      navigate(state.from)
    } else if (document.referrer.includes("/search")) {
      navigate(-1)
    } else {
      navigate("/")
    }
  }

  if (loading) {
    return <LoadingPage />
  }

  if (notFound) {
    return <NotFoundPage />
  }

  if (error || !item) {
    return <ErrorPage error={error || "Failed to load item"} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Navigation */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Main Content Card */}
        <article className="rounded-lg border border-border bg-card">
          {/* Header */}
          <header className="border-b border-border p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-card-foreground sm:text-3xl">
                {item.title}
              </h1>
              <span
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-sm font-medium capitalize",
                  getTypeBadgeClass(item.type, itemTypes)
                )}
              >
                {item.type}
              </span>
            </div>

            {/* Description */}
            <p className="mt-4 text-muted-foreground">{item.description}</p>

            {/* Metadata */}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {/* Category */}
              {item.category && (
                <span className="inline-flex items-center gap-1.5">
                  <Folder className="h-4 w-4" />
                  {item.category.name}
                </span>
              )}

              {/* View Count */}
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {item.view_count} views
              </span>

              {/* Like Button */}
              <LikeButton
                itemId={item.id}
                initialLikeCount={item.like_count || 0}
                size="md"
              />

              {/* Created Date */}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(item.created_at)}
              </span>

              {/* Last Updated */}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Updated {formatDateTime(item.updated_at)}
              </span>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {item.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/search?tags=${encodeURIComponent(tag.name)}`}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Item Image */}
          {getFullImageUrl(item.image_url) && (
            <div className="border-b border-border">
              <img
                src={getFullImageUrl(item.image_url)!}
                alt={item.title}
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}

          {/* Markdown Content */}
          <div className="p-6">
            <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0">
              <ReactMarkdown components={markdownComponents}>
                {item.content}
              </ReactMarkdown>
            </div>
          </div>
        </article>

        {/* Related Items Section */}
        <RelatedItems itemId={itemId} currentPath={location.pathname + location.search} />
      </div>
    </div>
  )
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const itemId = parseItemId(id)

  // Handle invalid ID synchronously before any effects run
  if (itemId === null) {
    return <NotFoundPage />
  }

  // Use key prop to remount component when itemId changes
  return <ItemDetailContent key={itemId} itemId={itemId} />
}
