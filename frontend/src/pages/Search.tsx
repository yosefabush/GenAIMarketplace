import { useSearchParams, Link } from "react-router-dom"
import { SearchBar } from "@/components/SearchBar"
import { TypeFilterChips, type ContentType } from "@/components/TypeFilterChips"
import { ArrowLeft } from "lucide-react"
import { useState, useCallback } from "react"

function SearchContent({
  initialQuery,
  initialType,
}: {
  initialQuery: string
  initialType: ContentType
}) {
  const [, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedType, setSelectedType] = useState<ContentType>(initialType)

  const updateUrl = useCallback(
    (query: string, type: ContentType) => {
      const params = new URLSearchParams()
      if (query.trim()) {
        params.set("q", query.trim())
      }
      if (type !== "all") {
        params.set("type", type)
      }
      setSearchParams(params)
    },
    [setSearchParams]
  )

  const handleSearch = useCallback(() => {
    updateUrl(searchQuery, selectedType)
  }, [searchQuery, selectedType, updateUrl])

  const handleTypeChange = useCallback(
    (type: ContentType) => {
      setSelectedType(type)
      updateUrl(searchQuery, type)
    },
    [searchQuery, updateUrl]
  )

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

      {/* Search Results Placeholder - to be implemented in US-011 */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">
          {initialQuery ? (
            <p>
              Search results for &quot;{initialQuery}&quot;
              {initialType !== "all" && ` (type: ${initialType})`} will be
              displayed here.
            </p>
          ) : (
            <p>Enter a search query to find AI capabilities.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const queryFromUrl = searchParams.get("q") || ""
  const typeFromUrl = (searchParams.get("type") || "all") as ContentType

  // Use key to reset component state when URL params change
  const key = `${queryFromUrl}-${typeFromUrl}`

  return (
    <SearchContent
      key={key}
      initialQuery={queryFromUrl}
      initialType={typeFromUrl}
    />
  )
}
