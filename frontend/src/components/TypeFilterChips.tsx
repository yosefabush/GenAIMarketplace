import { cn } from "@/lib/utils"

export type ContentType = "all" | "agent" | "prompt" | "mcp" | "workflow" | "docs"

export interface TypeFilterChipsProps {
  selectedType: ContentType
  onTypeChange: (type: ContentType) => void
  className?: string
}

const contentTypes: { value: ContentType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "agent", label: "Agents" },
  { value: "prompt", label: "Prompts" },
  { value: "mcp", label: "MCPs" },
  { value: "workflow", label: "Workflows" },
  { value: "docs", label: "Docs" },
]

export function TypeFilterChips({
  selectedType,
  onTypeChange,
  className,
}: TypeFilterChipsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        className
      )}
      role="group"
      aria-label="Filter by content type"
    >
      {contentTypes.map((type) => (
        <button
          key={type.value}
          onClick={() => onTypeChange(type.value)}
          className={cn(
            "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selectedType === type.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
          aria-pressed={selectedType === type.value}
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}
