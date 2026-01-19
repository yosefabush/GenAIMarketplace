import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api, type Tag } from '@/lib/api'
import {
  LogOut,
  LayoutDashboard,
  FolderTree,
  Tags as TagsIcon,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react'

export default function AdminTags() {
  const { logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch tags
  const fetchTags = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getTags()
      setTags(response.data.data)
    } catch (err) {
      console.error('Failed to fetch tags:', err)
      setError('Failed to load tags. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleAddNew = () => {
    setFormName('')
    setFormErrors({})
    setShowForm(true)
  }

  const handleNameChange = (name: string) => {
    setFormName(name)
    if (formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: '' }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formName.trim()) {
      errors.name = 'Name is required'
    } else if (formName.trim().length > 50) {
      errors.name = 'Name must be 50 characters or less'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      await api.createTag({
        name: formName.trim(),
      })
      toast({
        title: 'Tag created',
        description: `"${formName}" has been created successfully.`,
        variant: 'success',
      })

      setShowForm(false)
      fetchTags()
    } catch (err) {
      console.error('Failed to save tag:', err)
      const errorMessage = err instanceof Error && 'response' in err
        ? ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to save tag')
        : 'Failed to save tag'
      toast({
        title: 'Save failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
  }

  const handleDeleteClick = (tag: Tag) => {
    setTagToDelete(tag)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return

    setDeleting(true)
    try {
      await api.deleteTag(tagToDelete.id)
      setTags((prev) => prev.filter((tag) => tag.id !== tagToDelete.id))
      toast({
        title: 'Tag deleted',
        description: `"${tagToDelete.name}" has been deleted successfully.`,
        variant: 'success',
      })
      setDeleteDialogOpen(false)
      setTagToDelete(null)
    } catch (err) {
      console.error('Failed to delete tag:', err)
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the tag. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <TagsIcon className="w-6 h-6 text-[var(--primary)]" />
              <h1 className="text-lg font-semibold text-[var(--foreground)]">
                Tag Management
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/categories')}>
                <FolderTree className="w-4 h-4 mr-2" />
                Categories
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Tags
            </h2>
            {!loading && (
              <p className="text-sm text-[var(--muted-foreground)]">
                {tags.length} tags
              </p>
            )}
          </div>
          <Button onClick={handleAddNew} disabled={showForm}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tag
          </Button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="mb-8 p-6 border border-[var(--border)] rounded-lg bg-[var(--card)]">
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
              Add New Tag
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., python, testing, automation"
                  className={formErrors.name ? 'border-[var(--destructive)]' : ''}
                  maxLength={50}
                />
                {formErrors.name && (
                  <p className="text-sm text-[var(--destructive)]">{formErrors.name}</p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">
                  Tag names should be unique and descriptive (max 50 characters)
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Create Tag'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-[var(--destructive)]">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={fetchTags}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--muted)]">
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-12 text-[var(--muted-foreground)]"
                    >
                      No tags found. Click "Add Tag" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium">
                        {tag.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {tag.item_count !== undefined ? (
                          <span className={tag.item_count > 0 ? 'font-medium' : 'text-[var(--muted-foreground)]'}>
                            {tag.item_count}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-[var(--muted-foreground)]">
                        {formatDate(tag.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(tag)}
                          className="text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete {tag.name}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Tag</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{tagToDelete?.name}"?
                {tagToDelete?.item_count !== undefined && tagToDelete.item_count > 0 && (
                  <span className="block mt-2 text-[var(--destructive)] font-medium">
                    <AlertTriangle className="w-4 h-4 inline-block mr-1" />
                    Warning: This tag is used by {tagToDelete.item_count} item{tagToDelete.item_count !== 1 ? 's' : ''}.
                    The tag will be removed from those items.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
