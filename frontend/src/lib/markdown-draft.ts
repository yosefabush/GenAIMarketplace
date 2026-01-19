// Utility functions for managing markdown draft storage

export function clearMarkdownDraft(draftKey: string) {
  localStorage.removeItem(`markdown-draft-${draftKey}`)
}

export function getMarkdownDraft(draftKey: string): { content: string; timestamp: number } | null {
  const savedDraft = localStorage.getItem(`markdown-draft-${draftKey}`)
  if (!savedDraft) return null

  try {
    return JSON.parse(savedDraft)
  } catch {
    return null
  }
}

export function saveMarkdownDraft(draftKey: string, content: string) {
  localStorage.setItem(
    `markdown-draft-${draftKey}`,
    JSON.stringify({ content, timestamp: Date.now() })
  )
}
