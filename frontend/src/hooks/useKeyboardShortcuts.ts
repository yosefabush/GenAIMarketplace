import { useContext } from "react"
import { KeyboardShortcutsContext } from "@/contexts/keyboard-shortcuts-context"

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext)
  if (!context) {
    throw new Error("useKeyboardShortcuts must be used within a KeyboardShortcutsProvider")
  }
  return context
}
