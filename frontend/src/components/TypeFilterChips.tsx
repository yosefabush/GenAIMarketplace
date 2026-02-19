import { cn } from "@/lib/utils"
import { useItemTypes } from "@/hooks/useItemTypes"

// ContentType is now dynamic - "all" plus any slug from the database
export type ContentType = "all" | string

export interface TypeFilterChipsProps {
  selectedType: ContentType
  onTypeChange: (type: ContentType) => void
  className?: string
}

// Color mapping from color name to Tailwind classes for chips
const chipColorClasses: Record<string, { selected: string; unselected: string }> = {
  blue: {
    selected: "bg-blue-600 text-white shadow-sm",
    unselected: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800",
  },
  green: {
    selected: "bg-green-600 text-white shadow-sm",
    unselected: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800",
  },
  purple: {
    selected: "bg-purple-600 text-white shadow-sm",
    unselected: "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800",
  },
  orange: {
    selected: "bg-orange-600 text-white shadow-sm",
    unselected: "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-800",
  },
  gray: {
    selected: "bg-gray-600 text-white shadow-sm",
    unselected: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",
  },
  red: {
    selected: "bg-red-600 text-white shadow-sm",
    unselected: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800",
  },
  yellow: {
    selected: "bg-yellow-600 text-white shadow-sm",
    unselected: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800",
  },
  pink: {
    selected: "bg-pink-600 text-white shadow-sm",
    unselected: "bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:hover:bg-pink-800",
  },
  indigo: {
    selected: "bg-indigo-600 text-white shadow-sm",
    unselected: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800",
  },
  cyan: {
    selected: "bg-cyan-600 text-white shadow-sm",
    unselected: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:hover:bg-cyan-800",
  },
  teal: {
    selected: "bg-teal-600 text-white shadow-sm",
    unselected: "bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:hover:bg-teal-800",
  },
}

export function TypeFilterChips({
  selectedType,
  onTypeChange,
  className,
}: TypeFilterChipsProps) {
  const { itemTypes, isLoading } = useItemTypes()

  // Build content types array: "All" first, then dynamic types from API
  const contentTypes: { value: ContentType; label: string; color: string | null }[] = [
    { value: "all", label: "All", color: null },
    ...itemTypes.map((type) => ({
      value: type.slug,
      label: type.name,
      color: type.color,
    })),
  ]

  // Show skeleton loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-2",
          className
        )}
        role="group"
        aria-label="Filter by content type"
      >
        {/* Skeleton chips */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-9 w-20 animate-pulse rounded-full bg-secondary"
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        className
      )}
      role="group"
      aria-label="Filter by content type"
    >
      {contentTypes.map((type) => {
        const isSelected = selectedType === type.value
        const colorConfig = type.color ? chipColorClasses[type.color] : null

        // Determine classes based on selection state and color config
        let stateClass: string
        if (type.value === "all") {
          // "All" button uses primary/secondary colors
          stateClass = isSelected
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        } else if (colorConfig) {
          // Type with configured color
          stateClass = isSelected ? colorConfig.selected : colorConfig.unselected
        } else {
          // Fallback to gray for types without color
          stateClass = isSelected
            ? chipColorClasses.gray.selected
            : chipColorClasses.gray.unselected
        }

        return (
          <button
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            className={cn(
              "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              stateClass
            )}
            aria-pressed={isSelected}
          >
            {type.label}
          </button>
        )
      })}
    </div>
  )
}
