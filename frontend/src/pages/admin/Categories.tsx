import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { api, type Category } from '@/lib/api'
import {
  LogOut,
  LayoutDashboard,
  FolderTree,
  Tags,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function AdminCategories() {
  const { logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formParentId, setFormParentId] = useState<string>('none')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getCategories()
      setCategories(response.data.data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setError('Failed to load categories. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Build a map of parent category names for display
  const parentNameMap = useMemo(() => {
    const map: Record<number, string> = {}
    for (const cat of categories) {
      map[cat.id] = cat.name
    }
    return map
  }, [categories])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    setFormName('')
    setFormSlug('')
    setFormParentId('none')
    setFormErrors({})
    setShowForm(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormName(category.name)
    setFormSlug(category.slug)
    setFormParentId(category.parent_id ? category.parent_id.toString() : 'none')
    setFormErrors({})
    setShowForm(true)
  }

  const handleNameChange = (name: string) => {
    setFormName(name)
    // Auto-generate slug only when creating new category and slug hasn't been manually edited
    if (!editingCategory && formSlug === generateSlug(formName)) {
      setFormSlug(generateSlug(name))
    } else if (!editingCategory && formSlug === '') {
      setFormSlug(generateSlug(name))
    }
    if (formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: '' }))
    }
  }

  const handleSlugChange = (slug: string) => {
    // Only allow valid slug characters
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setFormSlug(cleanSlug)
    if (formErrors.slug) {
      setFormErrors((prev) => ({ ...prev, slug: '' }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formName.trim()) {
      errors.name = 'Name is required'
    }
    if (!formSlug.trim()) {
      errors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formSlug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      const parentId = formParentId === 'none' ? null : parseInt(formParentId)

      if (editingCategory) {
        // Update existing category
        await api.updateCategory(editingCategory.id, {
          name: formName.trim(),
          slug: formSlug.trim(),
          parent_id: parentId,
        })
        toast({
          title: 'Category updated',
          description: `"${formName}" has been updated successfully.`,
          variant: 'success',
        })
      } else {
        // Create new category
        await api.createCategory({
          name: formName.trim(),
          slug: formSlug.trim(),
          parent_id: parentId,
        })
        toast({
          title: 'Category created',
          description: `"${formName}" has been created successfully.`,
          variant: 'success',
        })
      }

      setShowForm(false)
      setEditingCategory(null)
      fetchCategories()
    } catch (err) {
      console.error('Failed to save category:', err)
      const errorMessage = err instanceof Error && 'response' in err
        ? ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to save category')
        : 'Failed to save category'
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
    setEditingCategory(null)
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    setDeleting(true)
    try {
      await api.deleteCategory(categoryToDelete.id)
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryToDelete.id))
      toast({
        title: 'Category deleted',
        description: `"${categoryToDelete.name}" has been deleted successfully.`,
        variant: 'success',
      })
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (err) {
      console.error('Failed to delete category:', err)
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the category. Please try again.',
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

  // Filter out the current category from parent options to avoid self-reference
  const availableParents = useMemo(() => {
    if (!editingCategory) return categories
    return categories.filter((cat) => cat.id !== editingCategory.id)
  }, [categories, editingCategory])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <FolderTree className="w-6 h-6 text-[var(--primary)]" />
              <h1 className="text-lg font-semibold text-[var(--foreground)]">
                Category Management
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/tags')}>
                <Tags className="w-4 h-4 mr-2" />
                Tags
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
              Categories
            </h2>
            {!loading && (
              <p className="text-sm text-[var(--muted-foreground)]">
                {categories.length} categories
              </p>
            )}
          </div>
          <Button onClick={handleAddNew} disabled={showForm}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-8 p-6 border border-[var(--border)] rounded-lg bg-[var(--card)]">
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Machine Learning"
                    className={formErrors.name ? 'border-[var(--destructive)]' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-[var(--destructive)]">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug *
                    <span className="text-xs text-[var(--muted-foreground)] ml-2">
                      (auto-generated from name)
                    </span>
                  </Label>
                  <Input
                    id="slug"
                    value={formSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="e.g., machine-learning"
                    className={formErrors.slug ? 'border-[var(--destructive)]' : ''}
                  />
                  {formErrors.slug && (
                    <p className="text-sm text-[var(--destructive)]">{formErrors.slug}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Category (optional)</Label>
                <Select value={formParentId} onValueChange={setFormParentId}>
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="No parent (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent (top-level)</SelectItem>
                    {availableParents.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  ) : editingCategory ? (
                    'Update Category'
                  ) : (
                    'Create Category'
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
              onClick={fetchCategories}
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
                  <TableHead>Slug</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-[var(--muted-foreground)]"
                    >
                      No categories found. Click "Add Category" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-[var(--muted-foreground)] font-mono text-sm">
                        {category.slug}
                      </TableCell>
                      <TableCell className="text-[var(--muted-foreground)]">
                        {category.parent_id ? parentNameMap[category.parent_id] || '-' : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {category.item_count !== undefined ? (
                          <span className={category.item_count > 0 ? 'font-medium' : 'text-[var(--muted-foreground)]'}>
                            {category.item_count}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-[var(--muted-foreground)]">
                        {formatDate(category.updated_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="sr-only">Edit {category.name}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(category)}
                            className="text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Delete {category.name}</span>
                          </Button>
                        </div>
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
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{categoryToDelete?.name}"?
                {categoryToDelete?.item_count && categoryToDelete.item_count > 0 && (
                  <span className="block mt-2 text-[var(--destructive)] font-medium">
                    <AlertTriangle className="w-4 h-4 inline-block mr-1" />
                    Warning: This category is used by {categoryToDelete.item_count} item{categoryToDelete.item_count !== 1 ? 's' : ''}.
                    Those items will have their category set to none.
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
