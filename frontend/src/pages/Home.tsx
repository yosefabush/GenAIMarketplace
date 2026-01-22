import { useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { SearchBar } from "@/components/SearchBar"
import { TypeFilterChips, type ContentType } from "@/components/TypeFilterChips"
import { RecentAdditions } from "@/components/RecentAdditions"
import { FeaturedItems } from "@/components/FeaturedItems"
import { ThemeToggle } from "@/components/ThemeToggle"
import { GlobalKeyboardHandler } from "@/components/GlobalKeyboardHandler"
import { Sparkles, Lightbulb } from "lucide-react"

export default function Home() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<ContentType>("all")

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
  }, [])

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim())
    }
    if (selectedType !== "all") {
      params.set("type", selectedType)
    }
    const queryString = params.toString()
    navigate(queryString ? `/search?${queryString}` : "/search")
  }, [searchQuery, selectedType, navigate])

  const handleTypeChange = useCallback(
    (type: ContentType) => {
      setSelectedType(type)
      const params = new URLSearchParams()
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim())
      }
      if (type !== "all") {
        params.set("type", type)
      }
      const queryString = params.toString()
      navigate(queryString ? `/search?${queryString}` : "/search")
    },
    [searchQuery, navigate]
  )

  return (
    <div className="min-h-screen bg-background">
      <GlobalKeyboardHandler onClearSearch={handleClearSearch} />

      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 md:pt-32 md:pb-20">
        {/* Logo/Brand */}
        <div className="mb-6 flex items-center gap-3 sm:mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
            <Sparkles className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            GenAI Marketplace
          </h1>
        </div>

        {/* Tagline */}
        <p className="mb-8 max-w-lg text-center text-base text-muted-foreground sm:mb-10 sm:text-lg md:text-xl">
          Discover and share AI agents, prompts, MCPs, and workflows with your
          team.
        </p>

        {/* Search Bar */}
        <div className="w-full max-w-2xl px-4 sm:px-0">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearch}
            autoFocus
          />
        </div>

        {/* Type Filter Chips */}
        <div className="mt-6 w-full max-w-2xl px-4 sm:mt-8 sm:px-0">
          <TypeFilterChips
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
          />
        </div>
      </div>

      {/* Featured Items Section */}
      <FeaturedItems />

      {/* Recent Additions Section */}
      <RecentAdditions />

      {/* Footer with Recommend Link */}
      <footer className="border-t mt-12 py-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-muted-foreground">
            Have a great AI resource to share?
          </p>
          <Link
            to="/recommend"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <Lightbulb className="h-4 w-4" />
            Recommend an Item
          </Link>
        </div>
      </footer>
    </div>
  )
}
