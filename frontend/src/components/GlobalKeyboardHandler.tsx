import { useEffect, useCallback } from "react"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

interface GlobalKeyboardHandlerProps {
  totalResults?: number
  onNavigateToResult?: (index: number) => void
  onClearSearch?: () => void
}

export function GlobalKeyboardHandler({
  totalResults = 0,
  onNavigateToResult,
  onClearSearch,
}: GlobalKeyboardHandlerProps) {
  const {
    isHelpModalOpen,
    setIsHelpModalOpen,
    highlightedIndex,
    setHighlightedIndex,
    focusSearchInput,
    blurSearchInput,
    isSearchInputFocused,
  } = useKeyboardShortcuts()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const tagName = target.tagName.toLowerCase()
      const isInputFocused =
        tagName === "input" || tagName === "textarea" || target.isContentEditable

      // '?' to show help modal (only when not in an input)
      if (event.key === "?" && !isInputFocused && !isHelpModalOpen) {
        event.preventDefault()
        setIsHelpModalOpen(true)
        return
      }

      // Escape to close modal or clear search
      if (event.key === "Escape") {
        if (isHelpModalOpen) {
          event.preventDefault()
          setIsHelpModalOpen(false)
          return
        }

        // If search is focused, clear it
        if (isSearchInputFocused()) {
          event.preventDefault()
          if (onClearSearch) {
            onClearSearch()
          }
          blurSearchInput()
          return
        }

        // Reset highlighted index
        if (highlightedIndex >= 0) {
          event.preventDefault()
          setHighlightedIndex(-1)
          return
        }
      }

      // Don't process other shortcuts if modal is open or typing in an input
      if (isHelpModalOpen) return

      // '/' or Ctrl+K to focus search (only when not in input)
      if (
        (event.key === "/" && !isInputFocused) ||
        (event.key === "k" && (event.ctrlKey || event.metaKey))
      ) {
        event.preventDefault()
        focusSearchInput()
        return
      }

      // Arrow key navigation for search results (only when not in input or when search is focused)
      if (totalResults > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault()
          const newIndex =
            highlightedIndex < totalResults - 1 ? highlightedIndex + 1 : 0
          setHighlightedIndex(newIndex)
          return
        }

        if (event.key === "ArrowUp") {
          event.preventDefault()
          const newIndex =
            highlightedIndex > 0 ? highlightedIndex - 1 : totalResults - 1
          setHighlightedIndex(newIndex)
          return
        }

        // Enter to navigate to highlighted result
        if (event.key === "Enter" && highlightedIndex >= 0 && !isInputFocused) {
          event.preventDefault()
          if (onNavigateToResult) {
            onNavigateToResult(highlightedIndex)
          }
          return
        }
      }
    },
    [
      isHelpModalOpen,
      setIsHelpModalOpen,
      highlightedIndex,
      setHighlightedIndex,
      focusSearchInput,
      blurSearchInput,
      isSearchInputFocused,
      totalResults,
      onNavigateToResult,
      onClearSearch,
    ]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  return null
}
