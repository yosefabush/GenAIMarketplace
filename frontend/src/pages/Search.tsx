import { useSearchParams, Link } from "react-router-dom"
import { SearchBar } from "@/components/SearchBar"
import { TypeFilterChips, type ContentType } from "@/components/TypeFilterChips"
import { SearchResultCard } from "@/components/SearchResultCard"
import { Pagination } from "@/components/Pagination"
import { ArrowLeft, SearchX, Loader2 } from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import { api, type Item } from "@/lib/api"

const ITEMS_PER_PAGE = 20

interface SearchState {
  items: Item[]
  total: number
  page: number
  isLoading: boolean
  error: string | null
}

function SearchContent({
  initialQuery,
  initialType,
  initialPage,
}: {
  initialQuery: string
  initialType: ContentType
  initialPage: number
}) {
  const [, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedType, setSelectedType] = useState<ContentType>(initialType)
  const [searchState, setSearchState] = useState<SearchState>({
    items: [],
    total: 0,
    page: initialPage,
    isLoading: true,
    error: null,
  })

  const updateUrl = useCallback(
    (query: string, type: ContentType, page: number = 1) => {
      const params = new URLSearchParams()
      if (query.trim()) {
        params.set("q", query.trim())
      }
      if (type !== "all") {
        params.set("type", type)
      }
      if (page > 1) {
        params.set("page", page.toString())
      }
      setSearchParams(params)
    },
    [setSearchParams]
  )

  // Perform search when component mounts (initial values come from props/URL)
  useEffect(() => {
    let cancelled = false

    async function performSearch() {
      setSearchState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const params: Record<string, string | number> = {
          page: initialPage,
          limit: ITEMS_PER_PAGE,
        }

        if (initialQuery.trim()) {
          params.q = initialQuery.trim()
        }

        if (initialType !== "all") {
          params.type = initialType
        }

        const response = await api.search(params)
        if (!cancelled) {
          setSearchState({
            items: response.data.data,
            total: response.data.total,
            page: response.data.page,
            isLoading: false,
            error: null,
          })
        }
      } catch {
        if (!cancelled) {
          setSearchState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Failed to fetch search results. Please try again.",
          }))
        }
      }
    }

    performSearch()

    return () => {
      cancelled = true
    }
  }, [initialQuery, initialType, initialPage])

  const handleSearch = useCallback(() => {
    updateUrl(searchQuery, selectedType, 1)
  }, [searchQuery, selectedType, updateUrl])

  const handleTypeChange = useCallback(
    (type: ContentType) => {
      setSelectedType(type)
      updateUrl(searchQuery, type, 1)
    },
    [searchQuery, updateUrl]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      updateUrl(searchQuery, selectedType, page)
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [searchQuery, selectedType, updateUrl]
  )

  const totalPages = Math.ceil(searchState.total / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
                className="max-w-2xl"
              />
            </div>
          </div>
          <div className="mt-4">
            <TypeFilterChips
              selectedType={selectedType}
              onTypeChange={handleTypeChange}
              className="justify-start"
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {searchState.isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Searching...</p>
          </div>
        )}

        {/* Error State */}
        {!searchState.isLoading && searchState.error && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-destructive">{searchState.error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchState.isLoading &&
          !searchState.error &&
          searchState.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <SearchX className="h-16 w-16 text-muted-foreground/50" />
              <h2 className="mt-4 text-xl font-semibold">No results found</h2>
              <p className="mt-2 text-center text-muted-foreground">
                {initialQuery ? (
                  <>
                    No items match your search for &quot;{initialQuery}&quot;
                    {initialType !== "all" && ` in ${initialType}s`}.
                  </>
                ) : (
                  <>No items found. Try adjusting your filters.</>
                )}
              </p>
            </div>
          )}

        {/* Results List */}
        {!searchState.isLoading &&
          !searchState.error &&
          searchState.items.length > 0 && (
            <>
              {/* Results Count */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing {(searchState.page - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(
                    searchState.page * ITEMS_PER_PAGE,
                    searchState.total
                  )}{" "}
                  of {searchState.total} results
                  {initialQuery && (
                    <> for &quot;{initialQuery}&quot;</>
                  )}
                </p>
              </div>

              {/* Results Grid */}
              <div className="grid gap-4">
                {searchState.items.map((item) => (
                  <SearchResultCard key={item.id} item={item} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                page={searchState.page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mt-8"
              />
            </>
          )}
      </div>
    </div>
  )
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const queryFromUrl = searchParams.get("q") || ""
  const typeFromUrl = (searchParams.get("type") || "all") as ContentType
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10)

  // Use key to reset component state when URL params change
  const key = `${queryFromUrl}-${typeFromUrl}-${pageFromUrl}`

  return (
    <SearchContent
      key={key}
      initialQuery={queryFromUrl}
      initialType={typeFromUrl}
      initialPage={pageFromUrl}
    />
  )
}
