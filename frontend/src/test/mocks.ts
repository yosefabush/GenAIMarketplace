import type { Item, Category, Tag, SearchResult, APIResponse, PaginatedResponse } from '@/lib/api'

// Mock categories
export const mockCategories: Category[] = [
  {
    id: 1,
    name: 'AI Assistants',
    slug: 'ai-assistants',
    parent_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    item_count: 5,
  },
  {
    id: 2,
    name: 'Code Generation',
    slug: 'code-generation',
    parent_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    item_count: 3,
  },
]

// Mock tags
export const mockTags: Tag[] = [
  { id: 1, name: 'python', created_at: '2025-01-01T00:00:00Z', item_count: 10 },
  { id: 2, name: 'typescript', created_at: '2025-01-01T00:00:00Z', item_count: 8 },
  { id: 3, name: 'automation', created_at: '2025-01-01T00:00:00Z', item_count: 5 },
]

// Mock items
export const mockItems: Item[] = [
  {
    id: 1,
    title: 'Code Review Agent',
    description: 'An AI agent that reviews code for best practices',
    content: '# Code Review Agent\n\nThis agent helps with code review.\n\n```python\nprint("Hello")\n```',
    type: 'agent',
    category_id: 1,
    view_count: 150,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    category: mockCategories[0],
    tags: [mockTags[0], mockTags[1]],
  },
  {
    id: 2,
    title: 'Bug Fix Prompt',
    description: 'A prompt template for fixing bugs',
    content: '# Bug Fix Prompt\n\nUse this prompt for debugging.',
    type: 'prompt',
    category_id: 2,
    view_count: 75,
    created_at: '2025-01-14T10:00:00Z',
    updated_at: '2025-01-14T10:00:00Z',
    category: mockCategories[1],
    tags: [mockTags[2]],
  },
  {
    id: 3,
    title: 'Database MCP',
    description: 'Model Context Protocol for database operations',
    content: '# Database MCP\n\nConnect to databases easily.',
    type: 'mcp',
    category_id: 1,
    view_count: 200,
    created_at: '2025-01-13T10:00:00Z',
    updated_at: '2025-01-13T10:00:00Z',
    category: mockCategories[0],
    tags: [mockTags[0]],
  },
]

// Mock search response
export const mockSearchResponse: SearchResult = {
  success: true,
  data: mockItems,
  total: 3,
  page: 1,
  limit: 20,
}

// Mock empty search response
export const mockEmptySearchResponse: SearchResult = {
  success: true,
  data: [],
  total: 0,
  page: 1,
  limit: 20,
}

// Mock API response for single item
export const mockItemResponse = (item: Item): APIResponse<Item> => ({
  success: true,
  data: item,
})

// Mock API response for items list
export const mockItemsListResponse = (items: Item[]): PaginatedResponse<Item> => ({
  success: true,
  data: items,
  total: items.length,
  page: 1,
  limit: 20,
})

// Mock API response for categories
export const mockCategoriesResponse: APIResponse<Category[]> = {
  success: true,
  data: mockCategories,
}

// Mock API response for tags
export const mockTagsResponse: APIResponse<Tag[]> = {
  success: true,
  data: mockTags,
}

// Mock API response for related items
export const mockRelatedItemsResponse: APIResponse<Item[]> = {
  success: true,
  data: mockItems.slice(1), // Return items except the first one
}

// Mock token validation responses
export const mockValidTokenResponse = {
  success: true,
  valid: true,
  message: 'Token is valid',
}

export const mockInvalidTokenResponse = {
  success: false,
  valid: false,
  message: 'Invalid token',
}

// Mock create item response
export const mockCreateItemResponse = (item: Partial<Item>): APIResponse<Item> => ({
  success: true,
  data: {
    id: Math.floor(Math.random() * 1000) + 100,
    title: item.title || 'New Item',
    description: item.description || 'Description',
    content: item.content || '',
    type: item.type || 'agent',
    category_id: item.category_id ?? null,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: item.category_id ? mockCategories[0] : null,
    tags: [],
  },
})
