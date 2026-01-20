import { createContext } from "react"

export interface KeyboardShortcutsContextType {
  isHelpModalOpen: boolean
  setIsHelpModalOpen: (open: boolean) => void
  highlightedIndex: number
  setHighlightedIndex: (index: number) => void
  focusSearchInput: () => void
  blurSearchInput: () => void
  isSearchInputFocused: () => boolean
  registerSearchInput: (element: HTMLInputElement | null) => void
}

export const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null)
