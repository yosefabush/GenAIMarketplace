import { memo, useState, useEffect, useCallback } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

// Generate a unique user identifier and store in localStorage
function getUserIdentifier(): string {
  const key = "genai-marketplace-user-id"
  let userId = localStorage.getItem(key)
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    localStorage.setItem(key, userId)
  }
  return userId
}

export interface LikeButtonProps {
  itemId: number
  initialLikeCount?: number
  initialLiked?: boolean
  size?: "sm" | "md" | "lg"
  showCount?: boolean
  className?: string
  onLikeChange?: (liked: boolean, likeCount: number) => void
}

export const LikeButton = memo(function LikeButton({
  itemId,
  initialLikeCount = 0,
  initialLiked,
  size = "md",
  showCount = true,
  className,
  onLikeChange,
}: LikeButtonProps) {
  const [liked, setLiked] = useState<boolean | undefined>(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  // Check initial like status on mount if not provided
  useEffect(() => {
    if (initialLiked === undefined) {
      const userIdentifier = getUserIdentifier()
      api.checkLike(itemId, userIdentifier)
        .then((response) => {
          setLiked(response.data.data.liked)
        })
        .catch(() => {
          setLiked(false)
        })
    }
  }, [itemId, initialLiked])

  // Update like count when initialLikeCount changes
  useEffect(() => {
    setLikeCount(initialLikeCount)
  }, [initialLikeCount])

  const handleToggleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return

    setIsLoading(true)
    const userIdentifier = getUserIdentifier()

    try {
      const response = await api.toggleLike(itemId, userIdentifier)
      const { liked: newLiked, like_count: newLikeCount } = response.data.data
      setLiked(newLiked)
      setLikeCount(newLikeCount)
      onLikeChange?.(newLiked, newLikeCount)
    } catch (error) {
      console.error("Failed to toggle like:", error)
    } finally {
      setIsLoading(false)
    }
  }, [itemId, isLoading, onLikeChange])

  const sizeClasses = {
    sm: "h-6 w-6 p-1",
    md: "h-8 w-8 p-1.5",
    lg: "h-10 w-10 p-2",
  }

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <button
      type="button"
      onClick={handleToggleLike}
      disabled={isLoading || liked === undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-md transition-all",
        "hover:scale-105 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md transition-colors",
          sizeClasses[size],
          liked
            ? "text-red-500 hover:text-red-600"
            : "text-muted-foreground hover:text-red-500"
        )}
      >
        <Heart
          size={iconSizes[size]}
          className={cn(
            "transition-all",
            liked && "fill-current"
          )}
        />
      </span>
      {showCount && (
        <span
          className={cn(
            "font-medium",
            textSizes[size],
            liked ? "text-red-500" : "text-muted-foreground"
          )}
        >
          {likeCount}
        </span>
      )}
    </button>
  )
})
