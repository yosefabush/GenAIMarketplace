import * as React from "react"
import { useRef, useEffect, useCallback } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search for AI capabilities...",
  className,
  autoFocus = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { registerSearchInput } = useKeyboardShortcuts()

  // Callback ref to register the input element
  const setInputRef = useCallback(
    (element: HTMLInputElement | null) => {
      // Store in local ref for internal use
      (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = element
      // Register with keyboard shortcuts context
      registerSearchInput(element)
    },
    [registerSearchInput]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      registerSearchInput(null)
    }
  }, [registerSearchInput])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSubmit) {
      onSubmit()
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={setInputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-14 w-full rounded-xl border-2 border-input bg-background pl-12 pr-4 text-lg shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />
    </div>
  )
}
