import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Pagination } from '@/components/Pagination'
import { ThemeToggle } from '@/components/ThemeToggle'
import { api, type Item } from '@/lib/api'
import {
  LogOut,
  LayoutDashboard,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  FolderTree,
  Tags,
  BarChart3,
  Lightbulb,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Type badge colors
const typeBadgeColors: Record<string, string> = {
  agent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  prompt: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  mcp: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  workflow: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  docs: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
}

const ITEMS_PER_PAGE = 20

const CONTENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'agent', label: 'Agent' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'mcp', label: 'MCP' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'docs', label: 'Docs' },
]

type SortField = 'title' | 'type' | 'view_count' | 'updated_at'
type SortDirection = 'asc' | 'desc'

export default function AdminDashboard() {
  const { logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // Sort state
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch all items (we'll filter/sort client-side for better UX)
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch a large batch for client-side filtering/sorting
        const response = await api.getItems({ limit: 1000, offset: 0 })
        setItems(response.data.data)
        setTotalItems(response.data.total)
      } catch (err) {
        console.error('Failed to fetch items:', err)
        setError('Failed to load items. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  // Filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items]

    // Filter by search query (title)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) =>
        item.title.toLowerCase().includes(query)
      )
    }

    // Filter by type
    if (typeFilter !== 'all') {
      result = result.filter((item) => item.type === typeFilter)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'view_count':
          comparison = a.view_count - b.view_count
          break
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [items, searchQuery, typeFilter, sortField, sortDirection])

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredAndSortedItems.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAndSortedItems, page])

  const totalPages = Math.ceil(filteredAndSortedItems.length / ITEMS_PER_PAGE)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, typeFilter])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddNew = () => {
    navigate('/admin/editor')
  }

  const handleEdit = (id: number) => {
    navigate(`/admin/editor/${id}`)
  }

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      // New field, default to descending for dates/views, ascending for text
      setSortField(field)
      setSortDirection(field === 'title' || field === 'type' ? 'asc' : 'desc')
    }
  }, [sortField])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    )
  }

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    setDeleting(true)
    try {
      await api.deleteItem(itemToDelete.id)
      // Remove from local state
      setItems((prev) => prev.filter((item) => item.id !== itemToDelete.id))
      toast({
        title: 'Item deleted',
        description: `"${itemToDelete.title}" has been deleted successfully.`,
        variant: 'success',
      })
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    } catch (err) {
      console.error('Failed to delete item:', err)
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the item. Please try again.',
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
              <LayoutDashboard className="w-6 h-6 text-[var(--primary)]" />
              <h1 className="text-lg font-semibold text-[var(--foreground)]">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/categories')}>
                <FolderTree className="w-4 h-4 mr-2" />
                Categories
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/tags')}>
                <Tags className="w-4 h-4 mr-2" />
                Tags
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/analytics')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/recommendations')}>
                <Lightbulb className="w-4 h-4 mr-2" />
                Recommendations
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
        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Content Items
            </h2>
            {!loading && (
              <p className="text-sm text-[var(--muted-foreground)]">
                {filteredAndSortedItems.length} of {totalItems} total items
              </p>
            )}
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Item
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[var(--muted)]">
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-[var(--foreground)] transition-colors"
                        onClick={() => handleSort('title')}
                      >
                        Title
                        {getSortIcon('title')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-[var(--foreground)] transition-colors"
                        onClick={() => handleSort('type')}
                      >
                        Type
                        {getSortIcon('type')}
                      </button>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center justify-end font-medium hover:text-[var(--foreground)] transition-colors w-full"
                        onClick={() => handleSort('view_count')}
                      >
                        Views
                        {getSortIcon('view_count')}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-[var(--foreground)] transition-colors"
                        onClick={() => handleSort('updated_at')}
                      >
                        Updated
                        {getSortIcon('updated_at')}
                      </button>
                    </TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-[var(--muted-foreground)]"
                      >
                        {searchQuery || typeFilter !== 'all'
                          ? 'No items match your filters.'
                          : 'No items found. Click "Add New Item" to create one.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium max-w-[250px] truncate">
                          {item.title}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeBadgeColors[item.type] || 'bg-gray-100 text-gray-800'}`}>
                            {item.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-[var(--muted-foreground)]">
                          {item.category?.name || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {item.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--muted)] text-[var(--muted-foreground)]"
                                >
                                  {tag.name}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  +{item.tags.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[var(--muted-foreground)]">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-[var(--muted-foreground)]">
                          {item.view_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-[var(--muted-foreground)]">
                          {formatDate(item.updated_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item.id)}
                            >
                              <Pencil className="w-4 h-4" />
                              <span className="sr-only">Edit {item.title}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(item)}
                              className="text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="sr-only">Delete {item.title}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
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
