import axios, { type AxiosInstance, type AxiosResponse } from 'axios'

// API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Handle common error cases
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.message)
    } else {
      // Something else happened
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// Request interceptor for adding auth token (used by admin routes)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// API Response types (matching backend schemas)
export interface APIResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
}

export interface Tag {
  id: number
  name: string
  created_at: string
  item_count?: number
}

export interface Category {
  id: number
  name: string
  slug: string
  parent_id: number | null
  created_at: string
  updated_at: string
  item_count?: number
}

export interface ItemType {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  created_at: string
  updated_at: string
  item_count?: number
}

export interface Item {
  id: number
  title: string
  description: string
  content: string
  type: string
  category_id: number | null
  view_count: number
  like_count: number
  created_at: string
  updated_at: string
  category: Category | null
  tags: Tag[]
}

// Like related types
export interface LikeToggleResponse {
  item_id: number
  liked: boolean
  like_count: number
}

export interface LikeCheckResponse {
  item_id: number
  liked: boolean
}

export interface LikeTotals {
  total_likes: number
  last_7_days: number
  last_30_days: number
}

export interface TopLikedItem {
  id: number
  title: string
  type: string
  like_count: number
}

export interface LikesOverTime {
  date: string
  count: number
}

export interface LikeAnalytics {
  totals: LikeTotals
  top_liked_items: TopLikedItem[]
  likes_over_time: LikesOverTime[]
}

export interface SearchResult {
  success: boolean
  data: Item[]
  total: number
  page: number
  limit: number
}

// Analytics types
export interface SearchTotals {
  last_7_days: number
  last_30_days: number
  all_time: number
}

export interface TopSearchQuery {
  query: string
  count: number
  avg_result_count: number
}

export interface SearchesBySource {
  source: string
  count: number
}

export interface ItemsByType {
  type: string
  count: number
}

export interface TopViewedItem {
  id: number
  title: string
  type: string
  view_count: number
}

export interface AnalyticsOverview {
  search_totals: SearchTotals
  top_searches: TopSearchQuery[]
  searches_by_source: SearchesBySource[]
  items_by_type: ItemsByType[]
  top_viewed_items: TopViewedItem[]
}

// Recommendation types
export interface Recommendation {
  id: number
  title: string
  description: string
  type: string
  category_id: number | null
  category_name: string | null
  submitter_email: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface RecommendationListResponse {
  items: Recommendation[]
  total: number
  page: number
  limit: number
}

export interface RecommendationCreate {
  title: string
  description: string
  type: string
  category_id?: number
  submitter_email: string
  reason: string
}

// Reset types
export interface ResetSummary {
  tables_cleared: string[]
  success: boolean
  message: string
}

// API Methods
export const api = {
  // Items
  getItems: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<PaginatedResponse<Item>>('/api/items', { params }),

  getItem: (id: number) =>
    apiClient.get<APIResponse<Item>>(`/api/items/${id}`),

  incrementViewCount: (id: number) =>
    apiClient.post<APIResponse<number>>(`/api/items/${id}/view`),

  getRelatedItems: (id: number, limit?: number) =>
    apiClient.get<APIResponse<Item[]>>(`/api/items/${id}/related`, { params: { limit } }),

  // Search
  search: (params: {
    q?: string
    type?: string
    category?: string
    tags?: string
    sort?: 'relevance' | 'date' | 'views'
    page?: number
    limit?: number
  }, signal?: AbortSignal) => apiClient.get<SearchResult>('/api/search', { params, signal }),

  // Categories
  getCategories: () =>
    apiClient.get<APIResponse<Category[]>>('/api/categories'),

  // Tags
  getTags: () =>
    apiClient.get<APIResponse<Tag[]>>('/api/tags'),

  // Admin endpoints
  createItem: (data: {
    title: string
    description: string
    content: string
    type: string
    category_id?: number
    tag_ids?: number[]
  }) => apiClient.post<APIResponse<Item>>('/api/items', data),

  updateItem: (id: number, data: Partial<{
    title: string
    description: string
    content: string
    type: string
    category_id: number
    tag_ids: number[]
  }>) => apiClient.put<APIResponse<Item>>(`/api/items/${id}`, data),

  deleteItem: (id: number) =>
    apiClient.delete<APIResponse<null>>(`/api/items/${id}`),

  createCategory: (data: { name: string; slug: string; parent_id?: number | null }) =>
    apiClient.post<APIResponse<Category>>('/api/categories', data),

  updateCategory: (id: number, data: { name?: string; slug?: string; parent_id?: number | null }) =>
    apiClient.put<APIResponse<Category>>(`/api/categories/${id}`, data),

  deleteCategory: (id: number) =>
    apiClient.delete<APIResponse<null>>(`/api/categories/${id}`),

  createTag: (data: { name: string }) =>
    apiClient.post<APIResponse<Tag>>('/api/tags', data),

  updateTag: (id: number, data: { name: string }) =>
    apiClient.put<APIResponse<Tag>>(`/api/tags/${id}`, data),

  deleteTag: (id: number) =>
    apiClient.delete<APIResponse<null>>(`/api/tags/${id}`),

  // Item Types
  getItemTypes: () =>
    apiClient.get<APIResponse<ItemType[]>>('/api/item-types'),

  getItemType: (id: number) =>
    apiClient.get<APIResponse<ItemType>>(`/api/item-types/${id}`),

  createItemType: (data: {
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    color?: string | null
  }) => apiClient.post<APIResponse<ItemType>>('/api/item-types', data),

  updateItemType: (id: number, data: {
    name?: string
    slug?: string
    description?: string | null
    icon?: string | null
    color?: string | null
  }) => apiClient.put<APIResponse<ItemType>>(`/api/item-types/${id}`, data),

  deleteItemType: (id: number) =>
    apiClient.delete<APIResponse<null>>(`/api/item-types/${id}`),

  // Auth
  validateToken: (token: string) =>
    apiClient.post<{ success: boolean; valid: boolean; message: string }>('/api/auth/validate', { token }),

  // Analytics
  getAnalytics: (params?: { start_date?: string; end_date?: string }) =>
    apiClient.get<APIResponse<AnalyticsOverview>>('/api/analytics/searches', { params }),

  getLikeAnalytics: (params?: { start_date?: string; end_date?: string }) =>
    apiClient.get<APIResponse<LikeAnalytics>>('/api/analytics/likes', { params }),

  // Likes
  toggleLike: (itemId: number, userIdentifier: string) =>
    apiClient.post<APIResponse<LikeToggleResponse>>(`/api/items/${itemId}/like`, { user_identifier: userIdentifier }),

  checkLike: (itemId: number, userIdentifier: string) =>
    apiClient.get<APIResponse<LikeCheckResponse>>(`/api/items/${itemId}/like/${userIdentifier}`),

  // Recommendations
  createRecommendation: (data: RecommendationCreate) =>
    apiClient.post<APIResponse<Recommendation>>('/api/recommendations', data),

  getRecommendations: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<APIResponse<RecommendationListResponse>>('/api/recommendations', { params }),

  getRecommendation: (id: number) =>
    apiClient.get<APIResponse<Recommendation>>(`/api/recommendations/${id}`),

  updateRecommendation: (id: number, data: { status?: string; admin_notes?: string }) =>
    apiClient.put<APIResponse<Recommendation>>(`/api/recommendations/${id}`, data),

  approveRecommendation: (id: number, data: { content: string; admin_notes?: string; tag_ids?: number[] }) =>
    apiClient.post<APIResponse<Item>>(`/api/recommendations/${id}/approve`, data),

  rejectRecommendation: (id: number, data: { admin_notes: string }) =>
    apiClient.post<APIResponse<Recommendation>>(`/api/recommendations/${id}/reject`, data),

  // Admin - Reset
  resetAllData: () =>
    apiClient.post<ResetSummary>('/api/admin/reset'),
}

export default apiClient
