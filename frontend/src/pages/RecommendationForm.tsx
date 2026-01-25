import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { ThemeToggle } from '@/components/ThemeToggle'
import { api, type Category } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { useItemTypes } from '@/hooks/useItemTypes'
import { ArrowLeft, Loader2, Send, Sparkles, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormData {
  title: string
  description: string
  type: string
  category_id: number | null
  submitter_email: string
  reason: string
}

interface FormErrors {
  title?: string
  description?: string
  type?: string
  submitter_email?: string
  reason?: string
}

export default function RecommendationForm() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { itemTypes, isLoading: isLoadingTypes } = useItemTypes()

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: '',
    category_id: null,
    submitter_email: '',
    reason: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Loading states
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Categories
  const [categories, setCategories] = useState<Category[]>([])

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

    if (!formData.submitter_email.trim()) {
      newErrors.submitter_email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.submitter_email)) {
      newErrors.submitter_email = 'Please enter a valid email address'
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
    } else if (formData.reason.length > 2000) {
      newErrors.reason = 'Reason must be 2000 characters or less'
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

    setIsSubmitting(true)

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        category_id: formData.category_id ?? undefined,
        submitter_email: formData.submitter_email.trim(),
        reason: formData.reason.trim(),
      }

      await api.createRecommendation(payload)
      setIsSubmitted(true)
      toast({
        title: 'Recommendation Submitted',
        description: 'Thank you! We\'ll review your recommendation and get back to you.',
      })
    } catch (err) {
      console.error('Failed to submit recommendation:', err)
      toast({
        title: 'Error',
        description: 'Failed to submit recommendation. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
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

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Lightbulb className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
          <p className="text-muted-foreground mb-8">
            Your recommendation has been submitted successfully. Our team will review it and get back to you via email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setIsSubmitted(false)} variant="outline">
              Submit Another
            </Button>
            <Button onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-semibold">Recommend an Item</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Section */}
        <div className="mb-8 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-medium mb-1">Have a great AI resource to share?</h2>
              <p className="text-sm text-muted-foreground">
                Submit your recommendation for a new item to add to the marketplace. Our team will review it and add valuable contributions to help the community.
              </p>
            </div>
          </div>
        </div>

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
              placeholder="e.g., Code Review AI Agent"
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
              placeholder="A brief description of what this item does and how it helps developers"
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
              disabled={isLoadingTypes}
            >
              <SelectTrigger className={cn(errors.type && 'border-destructive')}>
                <SelectValue placeholder={isLoadingTypes ? 'Loading...' : 'Select a type'} />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map((type) => (
                  <SelectItem key={type.slug} value={type.slug}>
                    {type.name}
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
            <Label>Category (Optional)</Label>
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

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className={cn(errors.submitter_email && 'text-destructive')}>
              Your Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.submitter_email}
              onChange={(e) => updateField('submitter_email', e.target.value)}
              placeholder="you@company.com"
              className={cn(errors.submitter_email && 'border-destructive')}
            />
            {errors.submitter_email && (
              <p className="text-sm text-destructive">{errors.submitter_email}</p>
            )}
            <p className="text-xs text-muted-foreground">
              We'll notify you when your recommendation is reviewed.
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className={cn(errors.reason && 'text-destructive')}>
              Why should we add this? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('reason', e.target.value)}
              placeholder="Explain why this item would be valuable for the team. Include any relevant links, use cases, or examples."
              rows={5}
              className={cn(errors.reason && 'border-destructive')}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.reason.length}/2000 characters
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Recommendation
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
