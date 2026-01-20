import { useState, useCallback, useRef, type ReactNode } from "react"
import { KeyboardShortcutsContext } from "./keyboard-shortcuts-context"

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchInputElementRef = useRef<HTMLInputElement | null>(null)

  const registerSearchInput = useCallback((element: HTMLInputElement | null) => {
    searchInputElementRef.current = element
  }, [])

  const focusSearchInput = useCallback(() => {
    searchInputElementRef.current?.focus()
  }, [])

  const blurSearchInput = useCallback(() => {
    searchInputElementRef.current?.blur()
  }, [])

  const isSearchInputFocused = useCallback(() => {
    return document.activeElement === searchInputElementRef.current
  }, [])

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        isHelpModalOpen,
        setIsHelpModalOpen,
        highlightedIndex,
        setHighlightedIndex,
        focusSearchInput,
        blurSearchInput,
        isSearchInputFocused,
        registerSearchInput,
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  )
}
