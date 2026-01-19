import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  Minus,
  Eye,
  Edit,
  Columns2,
  GripVertical,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getMarkdownDraft, saveMarkdownDraft } from "@/lib/markdown-draft"
import { CodeBlock, InlineCode } from "@/components/CodeBlock"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  draftKey?: string // Unique key for localStorage draft
  className?: string
}

type ViewMode = "edit" | "preview" | "split"

// Toolbar button configuration
interface ToolbarButton {
  icon: React.ElementType
  title: string
  action: (text: string, selectionStart: number, selectionEnd: number) => { text: string; cursorPos: number }
}

const toolbarButtons: ToolbarButton[] = [
  {
    icon: Bold,
    title: "Bold (Ctrl+B)",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end)
      const newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end)
      return { text: newText, cursorPos: selectedText ? end + 4 : start + 2 }
    },
  },
  {
    icon: Italic,
    title: "Italic (Ctrl+I)",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end)
      const newText = text.substring(0, start) + `*${selectedText}*` + text.substring(end)
      return { text: newText, cursorPos: selectedText ? end + 2 : start + 1 }
    },
  },
  {
    icon: Code,
    title: "Code",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end)
      // Multi-line selection gets code block, single line gets inline code
      if (selectedText.includes("\n")) {
        const newText = text.substring(0, start) + "```\n" + selectedText + "\n```" + text.substring(end)
        return { text: newText, cursorPos: start + 4 }
      } else {
        const newText = text.substring(0, start) + "`" + selectedText + "`" + text.substring(end)
        return { text: newText, cursorPos: selectedText ? end + 2 : start + 1 }
      }
    },
  },
  {
    icon: Heading1,
    title: "Heading 1",
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1
      const newText = text.substring(0, lineStart) + "# " + text.substring(lineStart)
      return { text: newText, cursorPos: end + 2 }
    },
  },
  {
    icon: Heading2,
    title: "Heading 2",
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1
      const newText = text.substring(0, lineStart) + "## " + text.substring(lineStart)
      return { text: newText, cursorPos: end + 3 }
    },
  },
  {
    icon: Heading3,
    title: "Heading 3",
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1
      const newText = text.substring(0, lineStart) + "### " + text.substring(lineStart)
      return { text: newText, cursorPos: end + 4 }
    },
  },
  {
    icon: List,
    title: "Bullet List",
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1
      const newText = text.substring(0, lineStart) + "- " + text.substring(lineStart)
      return { text: newText, cursorPos: end + 2 }
    },
  },
  {
    icon: ListOrdered,
    title: "Numbered List",
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1
      const newText = text.substring(0, lineStart) + "1. " + text.substring(lineStart)
      return { text: newText, cursorPos: end + 3 }
    },
  },
  {
    icon: LinkIcon,
    title: "Link",
    action: (text, start, end) => {
      const selectedText = text.substring(start, end) || "link text"
      const newText = text.substring(0, start) + `[${selectedText}](url)` + text.substring(end)
      // Position cursor at "url" to allow immediate typing
      return { text: newText, cursorPos: start + selectedText.length + 3 }
    },
  },
  {
    icon: Quote,
    title: "Blockquote",
    action: (text, start, end) => {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1
      const newText = text.substring(0, lineStart) + "> " + text.substring(lineStart)
      return { text: newText, cursorPos: end + 2 }
    },
  },
  {
    icon: Minus,
    title: "Horizontal Rule",
    action: (text, start) => {
      const newText = text.substring(0, start) + "\n---\n" + text.substring(start)
      return { text: newText, cursorPos: start + 5 }
    },
  },
]

// Custom components for ReactMarkdown with syntax highlighting
const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "")
    const isCodeBlock = match || (typeof children === "string" && children.includes("\n"))

    if (isCodeBlock) {
      const language = match ? match[1] : undefined
      const codeString = String(children).replace(/\n$/, "")
      return <CodeBlock language={language}>{codeString}</CodeBlock>
    }

    return <InlineCode {...props}>{children}</InlineCode>
  },
  pre({ children }) {
    return <>{children}</>
  },
}

// Generate line numbers for the textarea
function LineNumbers({ content }: { content: string }) {
  const lines = content.split("\n")
  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-12 bg-muted/50 border-r border-border text-right pr-2 pt-3 select-none pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {lines.map((_, i) => (
        <div
          key={i}
          className="text-xs text-muted-foreground leading-6 h-6"
        >
          {i + 1}
        </div>
      ))}
    </div>
  )
}

export function MarkdownEditor({
  value,
  onChange,
  draftKey,
  className,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("split")
  const [splitRatio, setSplitRatio] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [hasPendingDraft, setHasPendingDraft] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastSavedValueRef = useRef<string>(value)

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!draftKey) return

    const draft = getMarkdownDraft(draftKey)
    if (draft) {
      // Only restore if draft is less than 24 hours old
      const twentyFourHours = 24 * 60 * 60 * 1000
      if (Date.now() - draft.timestamp < twentyFourHours && draft.content !== value) {
        onChange(draft.content)
        lastSavedValueRef.current = draft.content
      }
    }
  }, [draftKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save draft to localStorage every 30 seconds
  useEffect(() => {
    if (!draftKey) return

    const interval = setInterval(() => {
      if (value !== lastSavedValueRef.current) {
        saveMarkdownDraft(draftKey, value)
        lastSavedValueRef.current = value
        setHasPendingDraft(false)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [draftKey, value])

  // Track if there's a pending draft (unsaved changes)
  useEffect(() => {
    if (!draftKey) return
    setHasPendingDraft(value !== lastSavedValueRef.current)
  }, [draftKey, value])

  // Handle toolbar button clicks
  const handleToolbarAction = (button: ToolbarButton) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const { selectionStart, selectionEnd } = textarea
    const result = button.action(value, selectionStart, selectionEnd)
    onChange(result.text)

    // Restore focus and set cursor position
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.cursorPos, result.cursorPos)
    })
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") {
        e.preventDefault()
        handleToolbarAction(toolbarButtons[0]) // Bold
      } else if (e.key === "i") {
        e.preventDefault()
        handleToolbarAction(toolbarButtons[1]) // Italic
      }
    }

    // Handle tab for indentation
    if (e.key === "Tab") {
      e.preventDefault()
      const textarea = e.currentTarget
      const { selectionStart, selectionEnd } = textarea
      const newText = value.substring(0, selectionStart) + "  " + value.substring(selectionEnd)
      onChange(newText)
      requestAnimationFrame(() => {
        textarea.setSelectionRange(selectionStart + 2, selectionStart + 2)
      })
    }
  }

  // Handle split pane drag
  const handleMouseDown = () => {
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100
      setSplitRatio(Math.min(Math.max(newRatio, 20), 80))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  // Sync textarea scroll with line numbers
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const lineNumbers = textarea.previousElementSibling as HTMLElement
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop
    }
  }

  return (
    <div className={cn("flex flex-col border border-border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-2 py-1">
        <div className="flex items-center gap-1 flex-wrap">
          {toolbarButtons.map((button, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleToolbarAction(button)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={button.title}
              aria-label={button.title}
            >
              <button.icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* View mode toggles */}
        <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-background">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === "edit"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Edit only"
            aria-label="Edit only"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === "split"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Split view"
            aria-label="Split view"
          >
            <Columns2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === "preview"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Preview only"
            aria-label="Preview only"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor and Preview */}
      <div
        ref={containerRef}
        className={cn(
          "flex flex-1 min-h-[400px]",
          isDragging && "select-none cursor-col-resize"
        )}
      >
        {/* Editor Pane */}
        {viewMode !== "preview" && (
          <div
            className="relative flex-1 min-w-0"
            style={viewMode === "split" ? { width: `${splitRatio}%`, flexGrow: 0, flexShrink: 0 } : undefined}
          >
            <LineNumbers content={value} />
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              className={cn(
                "w-full h-full resize-none p-3 pl-14",
                "font-mono text-sm leading-6",
                "bg-background text-foreground",
                "focus:outline-none focus:ring-0",
                "placeholder:text-muted-foreground"
              )}
              placeholder="Write your markdown content here..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Resizer */}
        {viewMode === "split" && (
          <div
            className={cn(
              "w-2 flex items-center justify-center cursor-col-resize hover:bg-muted/50 border-x border-border",
              isDragging && "bg-primary/20"
            )}
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Preview Pane */}
        {viewMode !== "edit" && (
          <div
            className="flex-1 min-w-0 overflow-auto p-6 bg-background"
            style={viewMode === "split" ? { width: `${100 - splitRatio}%`, flexGrow: 0, flexShrink: 0 } : undefined}
          >
            {value ? (
              <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0">
                <ReactMarkdown components={markdownComponents}>{value}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                Start typing to see the preview...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Draft indicator */}
      {draftKey && hasPendingDraft && (
        <div className="border-t border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
          Draft auto-saves every 30 seconds
        </div>
      )}
    </div>
  )
}
