import { useState, useEffect } from 'react'
import { api, type ItemType } from '@/lib/api'

export interface UseItemTypesResult {
  itemTypes: ItemType[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and cache item types from the API.
 * This is the single source of truth for item types across the app.
 */
export function useItemTypes(): UseItemTypesResult {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItemTypes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getItemTypes()
      if (response.data.success) {
        setItemTypes(response.data.data)
      }
    } catch (err) {
      setError('Failed to load item types')
      console.error('Error fetching item types:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItemTypes()
  }, [])

  return {
    itemTypes,
    isLoading,
    error,
    refetch: fetchItemTypes,
  }
}
