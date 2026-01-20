import { useSearchParams, Link } from "react-router-dom"
import { SearchBar } from "@/components/SearchBar"
import { SearchResultCard } from "@/components/SearchResultCard"
import { Pagination } from "@/components/Pagination"
import { FilterSidebar, type FilterState } from "@/components/FilterSidebar"
import { SortDropdown, type SortOption } from "@/components/SortDropdown"
import { ThemeToggle } from "@/components/ThemeToggle"
import type { ContentTypeValue } from "@/components/TypeFilterCheckboxes"
import { ArrowLeft, SearchX, Loader2, SlidersHorizontal, X } from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import { api, type Item } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 20

interface SearchState {
  items: Item[]
  total: number
  page: number
  isLoading: boolean
  error: string | null
}

interface SearchParams {
  query: string
  types: ContentTypeValue[]
  category: string | null
  tags: string[]
  sort: SortOption
  page: number
}

function parseSearchParams(searchParams: URLSearchParams): SearchParams {
  const query = searchParams.get("q") || ""
  const typeParam = searchParams.get("type") || ""
  const types = typeParam
    ? (typeParam.split(",").filter((t) =>
        ["agent", "prompt", "mcp", "workflow", "docs"].includes(t)
      ) as ContentTypeValue[])
    : []
  const category = searchParams.get("category") || null
  const tagsParam = searchParams.get("tags") || ""
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : []
  const sortParam = searchParams.get("sort") || "relevance"
  const sort = (["relevance", "date", "views"].includes(sortParam)
    ? sortParam
    : "relevance") as SortOption
  const page = parseInt(searchParams.get("page") || "1", 10)

  return { query, types, category, tags, sort, page }
}

function buildSearchParams(params: SearchParams): URLSearchParams {
  const urlParams = new URLSearchParams()
  if (params.query.trim()) {
    urlParams.set("q", params.query.trim())
  }
  if (params.types.length > 0) {
    urlParams.set("type", params.types.join(","))
  }
  if (params.category) {
    urlParams.set("category", params.category)
  }
  if (params.tags.length > 0) {
    urlParams.set("tags", params.tags.join(","))
  }
  if (params.sort !== "relevance") {
    urlParams.set("sort", params.sort)
  }
  if (params.page > 1) {
    urlParams.set("page", params.page.toString())
  }
  return urlParams
}

function SearchContent({
  initialParams,
}: {
  initialParams: SearchParams
}) {
  const [, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(initialParams.query)
  const [filters, setFilters] = useState<FilterState>({
    types: initialParams.types,
    category: initialParams.category,
    tags: initialParams.tags,
  })
  const [sort, setSort] = useState<SortOption>(initialParams.sort)
  const [searchState, setSearchState] = useState<SearchState>({
    items: [],
    total: 0,
    page: initialParams.page,
    isLoading: true,
    error: null,
  })
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const updateUrl = useCallback(
    (params: Partial<SearchParams>) => {
      const newParams: SearchParams = {
        query: params.query ?? searchQuery,
        types: params.types ?? filters.types,
        category: params.category !== undefined ? params.category : filters.category,
        tags: params.tags ?? filters.tags,
        sort: params.sort ?? sort,
        page: params.page ?? 1, // Reset to page 1 on filter change by default
      }
      setSearchParams(buildSearchParams(newParams))
    },
    [searchQuery, filters, sort, setSearchParams]
  )

  // Perform search when component mounts (initial values come from props/URL)
  useEffect(() => {
    let cancelled = false

    async function performSearch() {
      setSearchState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const params: Record<string, string | number> = {
          page: initialParams.page,
          limit: ITEMS_PER_PAGE,
        }

        if (initialParams.query.trim()) {
          params.q = initialParams.query.trim()
        }

        if (initialParams.types.length > 0) {
          params.type = initialParams.types.join(",")
        }

        if (initialParams.category) {
          params.category = initialParams.category
        }

        if (initialParams.tags.length > 0) {
          params.tags = initialParams.tags.join(",")
        }

        if (initialParams.sort !== "relevance") {
          params.sort = initialParams.sort
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
  }, [initialParams])

  const handleSearch = useCallback(() => {
    updateUrl({ query: searchQuery, page: 1 })
  }, [searchQuery, updateUrl])

  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters)
      updateUrl({
        types: newFilters.types,
        category: newFilters.category,
        tags: newFilters.tags,
        page: 1,
      })
    },
    [updateUrl]
  )

  const handleSortChange = useCallback(
    (newSort: SortOption) => {
      setSort(newSort)
      updateUrl({ sort: newSort, page: 1 })
    },
    [updateUrl]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      updateUrl({ page })
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [updateUrl]
  )

  const totalPages = Math.ceil(searchState.total / ITEMS_PER_PAGE)
  const hasActiveFilters =
    filters.types.length > 0 || filters.category !== null || filters.tags.length > 0
  const activeFilterCount =
    filters.types.length + (filters.category ? 1 : 0) + filters.tags.length

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
            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Filter Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Filter Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-background p-6 shadow-lg transition-transform lg:hidden",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">Filters</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <FilterSidebar
          filters={filters}
          onFiltersChange={(newFilters) => {
            handleFiltersChange(newFilters)
            setIsMobileSidebarOpen(false)
          }}
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
            <FilterSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Results Area */}
          <div className="flex-1 min-w-0">
            {/* Sort and Results Count Header */}
            {!searchState.isLoading && !searchState.error && searchState.items.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing {(searchState.page - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(
                    searchState.page * ITEMS_PER_PAGE,
                    searchState.total
                  )}{" "}
                  of {searchState.total} results
                  {initialParams.query && (
                    <> for &quot;{initialParams.query}&quot;</>
                  )}
                </p>
                <SortDropdown value={sort} onValueChange={handleSortChange} />
              </div>
            )}

            {/* Active Filters Pills */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.types.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                  >
                    {type}
                    <button
                      onClick={() =>
                        handleFiltersChange({
                          ...filters,
                          types: filters.types.filter((t) => t !== type),
                        })
                      }
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {filters.category && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                    Category: {filters.category}
                    <button
                      onClick={() =>
                        handleFiltersChange({ ...filters, category: null })
                      }
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                  >
                    {tag}
                    <button
                      onClick={() =>
                        handleFiltersChange({
                          ...filters,
                          tags: filters.tags.filter((t) => t !== tag),
                        })
                      }
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

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
                    {initialParams.query ? (
                      <>
                        No items match your search for &quot;{initialParams.query}&quot;
                        {hasActiveFilters && " with the selected filters"}.
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
      </div>
    </div>
  )
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const initialParams = parseSearchParams(searchParams)

  // Use key to reset component state when URL params change
  const key = JSON.stringify(initialParams)

  return <SearchContent key={key} initialParams={initialParams} />
}
