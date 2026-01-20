import { memo, useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"

interface CodeBlockProps {
  children: string
  language?: string
  className?: string
}

// Map common language aliases to their syntax highlighter names
const languageMap: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  tsx: "tsx",
  jsx: "jsx",
  py: "python",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
}

function normalizeLanguage(lang: string | undefined): string {
  if (!lang) return "text"
  const normalized = lang.toLowerCase()
  return languageMap[normalized] || normalized
}

export const CodeBlock = memo(function CodeBlock({ children, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const { resolvedTheme } = useTheme()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  const isDark = resolvedTheme === "dark"
  const normalizedLanguage = normalizeLanguage(language)

  return (
    <div className={cn("relative group not-prose", className)}>
      {/* Language badge and copy button */}
      <div className="absolute top-0 right-0 flex items-center gap-2 p-2 z-10">
        {language && (
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted/50">
            {language}
          </span>
        )}
        <button
          onClick={handleCopy}
          className={cn(
            "p-1.5 rounded transition-colors",
            "text-muted-foreground hover:text-foreground",
            "bg-muted/50 hover:bg-muted",
            "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
          title={copied ? "Copied!" : "Copy code"}
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Copied feedback toast */}
      {copied && (
        <div className="absolute top-2 right-14 text-xs text-green-500 bg-background/90 px-2 py-1 rounded shadow-sm border border-border animate-in fade-in duration-200">
          Copied!
        </div>
      )}

      {/* Syntax highlighted code */}
      <SyntaxHighlighter
        language={normalizedLanguage}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          padding: "1rem",
          paddingTop: "2.5rem", // Extra space for the copy button
          fontSize: "0.875rem",
          lineHeight: "1.5",
        }}
        codeTagProps={{
          style: {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          },
        }}
        showLineNumbers={children.split("\n").length > 3}
        wrapLongLines
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
})

// Inline code component (no syntax highlighting, just styled)
interface InlineCodeProps {
  children: React.ReactNode
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
      {children}
    </code>
  )
}
