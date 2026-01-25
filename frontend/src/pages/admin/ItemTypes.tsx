import { useState, useEffect, useCallback } from 'react'
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
import { ThemeToggle } from '@/components/ThemeToggle'
import { api, type ItemType } from '@/lib/api'
import {
  LogOut,
  LayoutDashboard,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Bot,
  MessageSquare,
  Plug,
  Workflow,
  FileText,
  Package,
  type LucideIcon,
} from 'lucide-react'

// Icon mapping for display
const iconMap: Record<string, LucideIcon> = {
  Bot: Bot,
  MessageSquare: MessageSquare,
  Plug: Plug,
  Workflow: Workflow,
  FileText: FileText,
  Package: Package,
}

const availableIcons = [
  { value: 'Bot', label: 'Bot' },
  { value: 'MessageSquare', label: 'Message' },
  { value: 'Plug', label: 'Plug' },
  { value: 'Workflow', label: 'Workflow' },
  { value: 'FileText', label: 'Document' },
  { value: 'Package', label: 'Package' },
]

const availableColors = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'gray', label: 'Gray', class: 'bg-gray-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
]

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function getColorClass(color: string | null): string {
  const found = availableColors.find(c => c.value === color)
  return found ? found.class : 'bg-gray-500'
}

export default function AdminItemTypes() {
  const { logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState<ItemType | null>(null)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formIcon, setFormIcon] = useState<string>('Package')
  const [formColor, setFormColor] = useState<string>('gray')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [typeToDelete, setTypeToDelete] = useState<ItemType | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch item types
  const fetchItemTypes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getItemTypes()
      setItemTypes(response.data.data)
    } catch (err) {
      console.error('Failed to fetch item types:', err)
      setError('Failed to load item types. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItemTypes()
  }, [fetchItemTypes])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleAddNew = () => {
    setEditingType(null)
    setFormName('')
    setFormSlug('')
    setFormDescription('')
    setFormIcon('Package')
    setFormColor('gray')
    setFormErrors({})
    setShowForm(true)
  }

  const handleEdit = (itemType: ItemType) => {
    setEditingType(itemType)
    setFormName(itemType.name)
    setFormSlug(itemType.slug)
    setFormDescription(itemType.description || '')
    setFormIcon(itemType.icon || 'Package')
    setFormColor(itemType.color || 'gray')
    setFormErrors({})
    setShowForm(true)
  }

  const handleNameChange = (name: string) => {
    setFormName(name)
    // Auto-generate slug only when creating new type and slug hasn't been manually edited
    if (!editingType && formSlug === generateSlug(formName)) {
      setFormSlug(generateSlug(name))
    } else if (!editingType && formSlug === '') {
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
      if (editingType) {
        // Update existing item type
        await api.updateItemType(editingType.id, {
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || null,
          icon: formIcon,
          color: formColor,
        })
        toast({
          title: 'Item type updated',
          description: `"${formName}" has been updated successfully.`,
          variant: 'success',
        })
      } else {
        // Create new item type
        await api.createItemType({
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || null,
          icon: formIcon,
          color: formColor,
        })
        toast({
          title: 'Item type created',
          description: `"${formName}" has been created successfully.`,
          variant: 'success',
        })
      }

      setShowForm(false)
      setEditingType(null)
      fetchItemTypes()
    } catch (err) {
      console.error('Failed to save item type:', err)
      const errorMessage = err instanceof Error && 'response' in err
        ? ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to save item type')
        : 'Failed to save item type'
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
    setEditingType(null)
  }

  const handleDeleteClick = (itemType: ItemType) => {
    setTypeToDelete(itemType)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!typeToDelete) return

    setDeleting(true)
    try {
      const response = await api.deleteItemType(typeToDelete.id)
      const deletedItemsCount = response.data.data?.deleted_items_count || 0
      setItemTypes((prev) => prev.filter((t) => t.id !== typeToDelete.id))
      toast({
        title: 'Item type deleted',
        description: deletedItemsCount > 0
          ? `"${typeToDelete.name}" and ${deletedItemsCount} related item(s) have been deleted.`
          : `"${typeToDelete.name}" has been deleted successfully.`,
        variant: 'success',
      })
      setDeleteDialogOpen(false)
      setTypeToDelete(null)
    } catch (err) {
      console.error('Failed to delete item type:', err)
      const errorMessage = err instanceof Error && 'response' in err
        ? ((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to delete the item type')
        : 'Failed to delete the item type'
      toast({
        title: 'Delete failed',
        description: errorMessage,
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

  const renderIcon = (iconName: string | null) => {
    const IconComponent = iconMap[iconName || 'Package'] || Package
    return <IconComponent className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-[var(--primary)]" />
              <h1 className="text-lg font-semibold text-[var(--foreground)]">
                Item Types Management
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <ThemeToggle />
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
              Item Types
            </h2>
            {!loading && (
              <p className="text-sm text-[var(--muted-foreground)]">
                {itemTypes.length} item types
              </p>
            )}
          </div>
          <Button onClick={handleAddNew} disabled={showForm}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item Type
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-8 p-6 border border-[var(--border)] rounded-lg bg-[var(--card)]">
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
              {editingType ? 'Edit Item Type' : 'Add New Item Type'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Tool"
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
                    placeholder="e.g., tool"
                    className={formErrors.slug ? 'border-[var(--destructive)]' : ''}
                  />
                  {formErrors.slug && (
                    <p className="text-sm text-[var(--destructive)]">{formErrors.slug}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g., External tools and utilities for AI workflows"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={formIcon} onValueChange={setFormIcon}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIcons.map((icon) => {
                        const IconComp = iconMap[icon.value] || Package
                        return (
                          <SelectItem key={icon.value} value={icon.value}>
                            <span className="flex items-center gap-2">
                              <IconComp className="w-4 h-4" />
                              {icon.label}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Select value={formColor} onValueChange={setFormColor}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColors.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <span className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded ${color.class}`} />
                            {color.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  ) : editingType ? (
                    'Update Item Type'
                  ) : (
                    'Create Item Type'
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
              onClick={fetchItemTypes}
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
                  <TableHead>Type</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemTypes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-[var(--muted-foreground)]"
                    >
                      No item types found. Click "Add Item Type" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  itemTypes.map((itemType) => (
                    <TableRow key={itemType.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded ${getColorClass(itemType.color)} text-white`}>
                            {renderIcon(itemType.icon)}
                          </span>
                          <span className="font-medium">{itemType.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[var(--muted-foreground)] font-mono text-sm">
                        {itemType.slug}
                      </TableCell>
                      <TableCell className="text-[var(--muted-foreground)] max-w-xs truncate">
                        {itemType.description || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {itemType.item_count !== undefined ? (
                          <span className={itemType.item_count > 0 ? 'font-medium' : 'text-[var(--muted-foreground)]'}>
                            {itemType.item_count}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-[var(--muted-foreground)]">
                        {formatDate(itemType.updated_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(itemType)}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="sr-only">Edit {itemType.name}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(itemType)}
                            className="text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Delete {itemType.name}</span>
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
              <DialogTitle>Delete Item Type</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{typeToDelete?.name}"?
                {typeToDelete?.item_count && typeToDelete.item_count > 0 && (
                  <span className="block mt-2 text-[var(--destructive)] font-medium">
                    <AlertTriangle className="w-4 h-4 inline-block mr-1" />
                    Warning: This will also delete {typeToDelete.item_count} item{typeToDelete.item_count !== 1 ? 's' : ''} that use this type.
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
