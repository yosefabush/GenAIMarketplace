import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground">
            Item detail page for item #{id} - coming soon (US-013)
          </p>
        </div>
      </div>
    </div>
  )
}
