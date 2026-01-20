import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

interface ShortcutItem {
  keys: string[]
  description: string
}

const shortcuts: ShortcutItem[] = [
  { keys: ["/", "Ctrl+K"], description: "Focus search bar" },
  { keys: ["Esc"], description: "Clear search or close modal" },
  { keys: ["\u2191", "\u2193"], description: "Navigate search results" },
  { keys: ["Enter"], description: "Open highlighted result" },
  { keys: ["?"], description: "Show this help" },
]

function ShortcutKey({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-foreground shadow-sm">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsHelp() {
  const { isHelpModalOpen, setIsHelpModalOpen } = useKeyboardShortcuts()

  return (
    <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate the app faster.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1.5">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex} className="flex items-center gap-1.5">
                    {keyIndex > 0 && (
                      <span className="text-xs text-muted-foreground">or</span>
                    )}
                    <ShortcutKey>{key}</ShortcutKey>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
