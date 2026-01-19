import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TagInput } from '@/components/TagInput'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { clearMarkdownDraft } from '@/lib/markdown-draft'
import { api, type Category, type Item } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { ArrowLeft, LayoutDashboard, Loader2, Save, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

// Content types
const CONTENT_TYPES = [
  { value: 'agent', label: 'Agent' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'mcp', label: 'MCP' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'docs', label: 'Docs' },
]

interface FormData {
  title: string
  description: string
  content: string
  type: string
  category_id: number | null
  tag_ids: number[]
}

interface FormErrors {
  title?: string
  description?: string
  type?: string
}

function parseItemId(id: string | undefined): number | null {
  if (!id) return null
  const parsed = parseInt(id, 10)
  return isNaN(parsed) ? null : parsed
}

export default function AdminEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const itemId = parseItemId(id)
  const isEditing = itemId !== null

  // Generate a unique draft key based on item ID or "new"
  const draftKey = useMemo(() => {
    return isEditing ? `editor-${itemId}` : 'editor-new'
  }, [isEditing, itemId])

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    content: '',
    type: '',
    category_id: null,
    tag_ids: [],
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Loading states
  const [isLoadingItem, setIsLoadingItem] = useState(isEditing)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Categories
  const [categories, setCategories] = useState<Category[]>([])

  // Fetch item data if editing
  useEffect(() => {
    if (!isEditing || itemId === null) return

    const currentItemId = itemId
    let cancelled = false

    async function fetchItem() {
      try {
        const response = await api.getItem(currentItemId)
        if (!cancelled && response.data.success) {
          const item: Item = response.data.data
          setFormData({
            title: item.title,
            description: item.description,
            content: item.content,
            type: item.type,
            category_id: item.category_id,
            tag_ids: item.tags.map((tag) => tag.id),
          })
        }
      } catch (err) {
        console.error('Failed to fetch item:', err)
        toast({
          title: 'Error',
          description: 'Failed to load item. Please try again.',
          variant: 'destructive',
        })
        navigate('/admin/dashboard')
      } finally {
        if (!cancelled) {
          setIsLoadingItem(false)
        }
      }
    }

    fetchItem()

    return () => {
      cancelled = true
    }
  }, [itemId, isEditing, navigate, toast])

  // Fetch categories
  useEffect(() => {
    let cancelled = false

    async function fetchCategories() {
      try {
        const response = await api.getCategories()
        if (!cancelled && response.data.success) {
          setCategories(response.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      } finally {
        if (!cancelled) {
          setIsLoadingCategories(false)
        }
      }
    }

    fetchCategories()

    return () => {
      cancelled = true
    }
  }, [])

  // Validation
  function validateForm(): boolean {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less'
    }

    if (!formData.type) {
      newErrors.type = 'Type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content,
        type: formData.type,
        category_id: formData.category_id ?? undefined,
        tag_ids: formData.tag_ids,
      }

      if (isEditing && itemId !== null) {
        await api.updateItem(itemId, payload)
        toast({
          title: 'Success',
          description: 'Item updated successfully.',
        })
      } else {
        await api.createItem(payload)
        toast({
          title: 'Success',
          description: 'Item created successfully.',
        })
      }

      // Clear the draft on successful save
      clearMarkdownDraft(draftKey)

      navigate('/admin/dashboard')
    } catch (err) {
      console.error('Failed to save item:', err)
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} item. Please try again.`,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/admin/dashboard')
  }

  // Update form field
  function updateField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is modified
    if (field in errors) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field as keyof FormErrors]
        return newErrors
      })
    }
  }

  // Show loading state if fetching existing item
  if (isLoadingItem) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-[var(--primary)]" />
              <h1 className="text-lg font-semibold text-[var(--foreground)]">
                {isEditing ? 'Edit Item' : 'New Item'}
              </h1>
            </div>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className={cn(errors.title && 'text-destructive')}>
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Enter a descriptive title"
              className={cn(errors.title && 'border-destructive')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className={cn(errors.description && 'text-destructive')}>
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('description', e.target.value)}
              placeholder="Provide a brief description of this item"
              rows={3}
              className={cn(errors.description && 'border-destructive')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label className={cn(errors.type && 'text-destructive')}>
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => updateField('type', value)}
            >
              <SelectTrigger className={cn(errors.type && 'border-destructive')}>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category_id?.toString() ?? 'none'}
              onValueChange={(value) =>
                updateField('category_id', value === 'none' ? null : parseInt(value, 10))
              }
              disabled={isLoadingCategories}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingCategories ? 'Loading...' : 'Select a category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <TagInput
            selectedTagIds={formData.tag_ids}
            onTagsChange={(tagIds) => updateField('tag_ids', tagIds)}
          />

          {/* Content - Markdown editor with split-pane preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Label>Content (Markdown)</Label>
            </div>
            <MarkdownEditor
              value={formData.content}
              onChange={(content) => updateField('content', content)}
              draftKey={draftKey}
              className="min-h-[500px]"
            />
            <p className="text-xs text-muted-foreground">
              Use the toolbar to format text. Toggle between edit, split, and preview modes. Drafts auto-save every 30 seconds.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Item' : 'Create Item'}
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
