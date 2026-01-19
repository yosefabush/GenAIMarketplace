import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, LayoutDashboard } from 'lucide-react'

export default function AdminEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const isEditing = Boolean(id)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-[var(--primary)]" />
              <h1 className="text-lg font-semibold text-[var(--foreground)]">
                {isEditing ? 'Edit Item' : 'New Item'}
              </h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-[var(--foreground)] mb-2">
            Content Editor
          </h2>
          <p className="text-[var(--muted-foreground)]">
            {isEditing ? `Editing item ${id}` : 'Create a new item'}
          </p>
          <p className="text-[var(--muted-foreground)] mt-4">
            Full editor coming in a future update.
          </p>
        </div>
      </main>
    </div>
  )
}
