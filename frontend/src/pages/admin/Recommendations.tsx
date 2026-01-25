import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useItemTypes } from '@/hooks/useItemTypes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
  TableCell,
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
import { TagInput } from '@/components/TagInput'
import { MarkdownEditor } from '@/components/MarkdownEditor'
import { api, type Recommendation, type ItemType } from '@/lib/api'
import {
  LogOut,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  ArrowLeft,
  Check,
  X,
  Eye,
  Mail,
  Calendar,
  FileText,
} from 'lucide-react'

// Status badge colors
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

// Color mapping from color name to Tailwind classes
const colorClasses: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
}

// Fallback type colors for legacy types
const fallbackTypeColors: Record<string, string> = {
  agent: colorClasses.blue,
  prompt: colorClasses.green,
  mcp: colorClasses.yellow,
  workflow: colorClasses.purple,
  docs: colorClasses.gray,
  skill: colorClasses.indigo,
}

function getTypeBadgeClass(type: string, itemTypes?: ItemType[]): string {
  if (itemTypes && itemTypes.length > 0) {
    const itemType = itemTypes.find(
      (t) => t.slug.toLowerCase() === type.toLowerCase() || t.name.toLowerCase() === type.toLowerCase()
    )
    if (itemType?.color) {
      return colorClasses[itemType.color] || colorClasses.gray
    }
  }
  return fallbackTypeColors[type.toLowerCase()] || colorClasses.gray
}

export default function AdminRecommendations() {
  const { logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { itemTypes } = useItemTypes()

  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20

  // View modal state
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null)

  // Approve modal state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [approveContent, setApproveContent] = useState('')
  const [approveNotes, setApproveNotes] = useState('')
  const [approveTagIds, setApproveTagIds] = useState<number[]>([])
  const [approving, setApproving] = useState(false)

  // Reject modal state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')
  const [rejecting, setRejecting] = useState(false)

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: { status?: string; page: number; limit: number } = { page, limit }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const response = await api.getRecommendations(params)
      setRecommendations(response.data.data.items)
      setTotal(response.data.data.total)
    } catch (err) {
      console.error('Failed to fetch recommendations:', err)
      setError('Failed to load recommendations. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleView = (rec: Recommendation) => {
    setSelectedRec(rec)
    setViewDialogOpen(true)
  }

  const handleApproveClick = (rec: Recommendation) => {
    setSelectedRec(rec)
    setApproveContent('')
    setApproveNotes('')
    setApproveTagIds([])
    setApproveDialogOpen(true)
  }

  const handleRejectClick = (rec: Recommendation) => {
    setSelectedRec(rec)
    setRejectNotes('')
    setRejectDialogOpen(true)
  }

  const handleApproveConfirm = async () => {
    if (!selectedRec || !approveContent.trim()) {
      toast({
        title: 'Content required',
        description: 'Please provide content for the new item.',
        variant: 'destructive',
      })
      return
    }

    setApproving(true)
    try {
      await api.approveRecommendation(selectedRec.id, {
        content: approveContent,
        admin_notes: approveNotes || undefined,
        tag_ids: approveTagIds.length > 0 ? approveTagIds : undefined,
      })
      toast({
        title: 'Recommendation approved',
        description: 'The item has been created and the submitter has been notified.',
        variant: 'success',
      })
      setApproveDialogOpen(false)
      fetchRecommendations()
    } catch (err) {
      console.error('Failed to approve recommendation:', err)
      toast({
        title: 'Approval failed',
        description: 'Failed to approve the recommendation. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setApproving(false)
    }
  }

  const handleRejectConfirm = async () => {
    if (!selectedRec || !rejectNotes.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      })
      return
    }

    setRejecting(true)
    try {
      await api.rejectRecommendation(selectedRec.id, {
        admin_notes: rejectNotes,
      })
      toast({
        title: 'Recommendation rejected',
        description: 'The submitter has been notified.',
        variant: 'success',
      })
      setRejectDialogOpen(false)
      fetchRecommendations()
    } catch (err) {
      console.error('Failed to reject recommendation:', err)
      toast({
        title: 'Rejection failed',
        description: 'Failed to reject the recommendation. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setRejecting(false)
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

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-semibold">Recommendations</h1>
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
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header with Filter */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Item Recommendations</h2>
            {!loading && (
              <p className="text-sm text-muted-foreground">
                {total} recommendation{total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="sr-only">
              Filter by status
            </Label>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger id="status-filter" className="w-[150px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchRecommendations}>
              Retry
            </Button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div className="border rounded-lg overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No recommendations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recommendations.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell className="font-medium max-w-[250px]">
                          <div className="truncate">{rec.title}</div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              getTypeBadgeClass(rec.type, itemTypes)
                            }`}
                          >
                            {rec.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              statusColors[rec.status] || statusColors.pending
                            }`}
                          >
                            {rec.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px]">
                          <div className="truncate">{rec.submitter_email}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(rec.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(rec)}
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {rec.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApproveClick(rec)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectClick(rec)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
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
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRec?.title}</DialogTitle>
              <DialogDescription>
                Recommendation details
              </DialogDescription>
            </DialogHeader>
            {selectedRec && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                      getTypeBadgeClass(selectedRec.type, itemTypes)
                    }`}
                  >
                    {selectedRec.type}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                      statusColors[selectedRec.status] || statusColors.pending
                    }`}
                  >
                    {selectedRec.status}
                  </span>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Description</Label>
                  <p className="mt-1">{selectedRec.description}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">Reason for Recommendation</Label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedRec.reason}</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {selectedRec.submitter_email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedRec.created_at)}
                  </div>
                  {selectedRec.category_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      {selectedRec.category_name}
                    </div>
                  )}
                </div>

                {selectedRec.admin_notes && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-muted-foreground text-sm">Admin Notes</Label>
                    <p className="mt-1">{selectedRec.admin_notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
              {selectedRec?.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setViewDialogOpen(false)
                      handleRejectClick(selectedRec)
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setViewDialogOpen(false)
                      handleApproveClick(selectedRec)
                    }}
                  >
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Approve Recommendation</DialogTitle>
              <DialogDescription>
                Create a new item from "{selectedRec?.title}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-muted-foreground text-sm">Original Description</Label>
                <p className="mt-1 text-sm">{selectedRec?.description}</p>
              </div>

              <div className="space-y-2">
                <Label>Content (Markdown) *</Label>
                <MarkdownEditor
                  value={approveContent}
                  onChange={setApproveContent}
                  draftKey={`approve-${selectedRec?.id}`}
                  className="min-h-[300px]"
                />
              </div>

              <TagInput
                selectedTagIds={approveTagIds}
                onTagsChange={setApproveTagIds}
              />

              <div className="space-y-2">
                <Label htmlFor="approve-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="approve-notes"
                  value={approveNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setApproveNotes(e.target.value)}
                  placeholder="Notes to include in the approval email..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={approving}>
                Cancel
              </Button>
              <Button onClick={handleApproveConfirm} disabled={approving}>
                {approving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Approve & Create Item
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Recommendation</DialogTitle>
              <DialogDescription>
                Reject "{selectedRec?.title}" and notify the submitter.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reject-notes">Reason for Rejection *</Label>
                <Textarea
                  id="reject-notes"
                  value={rejectNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectNotes(e.target.value)}
                  placeholder="Explain why this recommendation is being rejected..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This will be included in the notification email to the submitter.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={rejecting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectConfirm} disabled={rejecting}>
                {rejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
