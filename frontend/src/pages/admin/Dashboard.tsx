import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table'
import { Pagination } from '@/components/Pagination'
import { api, type Item } from '@/lib/api'
import {
  LogOut,
  LayoutDashboard,
  Plus,
  Pencil,
  Loader2
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

export default function AdminDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      setError(null)
      try {
        const offset = (page - 1) * ITEMS_PER_PAGE
        const response = await api.getItems({ limit: ITEMS_PER_PAGE, offset })
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
  }, [page])

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
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
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
                {totalItems} total items
              </p>
            )}
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Item
          </Button>
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
              onClick={() => setPage(1)}
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
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-[var(--muted-foreground)]"
                      >
                        No items found. Click "Add New Item" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item.id)}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="sr-only">Edit {item.title}</span>
                          </Button>
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
      </main>
    </div>
  )
}
