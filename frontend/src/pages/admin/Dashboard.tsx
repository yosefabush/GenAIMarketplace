import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut, LayoutDashboard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
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
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-[var(--foreground)] mb-2">
            Welcome to the Admin Dashboard
          </h2>
          <p className="text-[var(--muted-foreground)]">
            Content management features coming soon.
          </p>
        </div>
      </main>
    </div>
  )
}
