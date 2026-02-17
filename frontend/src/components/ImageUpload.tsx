import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  className?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function getFullImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF')
      return
    }

    if (file.size > MAX_SIZE) {
      setError(`File too large. Maximum size is 5MB, got ${(file.size / (1024 * 1024)).toFixed(1)}MB`)
      return
    }

    setIsUploading(true)
    try {
      const response = await api.uploadImage(file)
      onChange(response.data.url)
    } catch (err) {
      console.error('Upload failed:', err)
      setError('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [onChange])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleRemove = () => {
    onChange(null)
    setError(null)
  }

  const fullUrl = getFullImageUrl(value)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <Label>Image</Label>
      </div>

      {fullUrl ? (
        <div className="relative rounded-lg border border-border overflow-hidden">
          <img
            src={fullUrl}
            alt="Item image"
            className="w-full max-h-64 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
            isUploading && 'pointer-events-none opacity-60'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, WebP, or GIF (max 5MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
