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

export interface Item {
  id: number
  title: string
  description: string
  content: string
  type: string
  category_id: number | null
  view_count: number
  created_at: string
  updated_at: string
  category: Category | null
  tags: Tag[]
}

export interface SearchResult {
  success: boolean
  data: Item[]
  total: number
  page: number
  limit: number
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
  }) => apiClient.get<SearchResult>('/api/search', { params }),

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

  // Auth
  validateToken: (token: string) =>
    apiClient.post<{ success: boolean; valid: boolean; message: string }>('/api/auth/validate', { token }),
}

export default apiClient
