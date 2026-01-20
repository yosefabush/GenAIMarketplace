import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from './test-utils'
import userEvent from '@testing-library/user-event'
import Search from '@/pages/Search'
import ItemDetail from '@/pages/ItemDetail'
import { mockItems, mockSearchResponse, mockEmptySearchResponse, mockCategoriesResponse, mockTagsResponse, mockItemResponse, mockRelatedItemsResponse } from './mocks'
import { api } from '@/lib/api'

// Mock the API module
vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual('@/lib/api')
  return {
    ...actual,
    api: {
      search: vi.fn(),
      getItem: vi.fn(),
      getCategories: vi.fn(),
      getTags: vi.fn(),
      incrementViewCount: vi.fn(),
      getRelatedItems: vi.fn(),
    },
  }
})

describe('Search and View Item Flow', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mocks
    vi.mocked(api.search).mockResolvedValue({ data: mockSearchResponse } as never)
    vi.mocked(api.getCategories).mockResolvedValue({ data: mockCategoriesResponse } as never)
    vi.mocked(api.getTags).mockResolvedValue({ data: mockTagsResponse } as never)
    vi.mocked(api.getItem).mockResolvedValue({ data: mockItemResponse(mockItems[0]) } as never)
    vi.mocked(api.incrementViewCount).mockResolvedValue({ data: { success: true, data: 151 } } as never)
    vi.mocked(api.getRelatedItems).mockResolvedValue({ data: mockRelatedItemsResponse } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Search Page', () => {
    it('renders the search page with search bar', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search'] } })

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search for AI capabilities...')).toBeInTheDocument()
      })
    })

    it('displays search results when results are found', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      await waitFor(() => {
        expect(screen.getByText('Code Review Agent')).toBeInTheDocument()
        expect(screen.getByText('Bug Fix Prompt')).toBeInTheDocument()
        expect(screen.getByText('Database MCP')).toBeInTheDocument()
      })
    })

    it('displays loading state while searching', async () => {
      // Make the search take longer
      vi.mocked(api.search).mockImplementation(() =>
        new Promise((resolve) => setTimeout(() => resolve({ data: mockSearchResponse } as never), 100))
      )

      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      expect(screen.getByText('Searching...')).toBeInTheDocument()
    })

    it('displays empty state when no results found', async () => {
      vi.mocked(api.search).mockResolvedValue({ data: mockEmptySearchResponse } as never)

      render(<Search />, { routerProps: { initialEntries: ['/search?q=nonexistent'] } })

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument()
      })
    })

    it('displays result count correctly', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      await waitFor(() => {
        expect(screen.getByText(/Showing 1-3 of 3 results/)).toBeInTheDocument()
      })
    })

    it('submits search when pressing Enter', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search'] } })

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search for AI capabilities...')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search for AI capabilities...')
      await user.type(searchInput, 'code review')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(api.search).toHaveBeenCalled()
      })
    })

    it('displays type badges on search result cards', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      await waitFor(() => {
        expect(screen.getByText('agent')).toBeInTheDocument()
        expect(screen.getByText('prompt')).toBeInTheDocument()
        expect(screen.getByText('mcp')).toBeInTheDocument()
      })
    })

    it('displays category badges on search result cards', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      await waitFor(() => {
        expect(screen.getAllByText('AI Assistants').length).toBeGreaterThan(0)
      })
    })

    it('displays tags on search result cards', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      await waitFor(() => {
        expect(screen.getAllByText('python').length).toBeGreaterThan(0)
      })
    })

    it('displays view counts on search result cards', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
        expect(screen.getByText('75')).toBeInTheDocument()
        expect(screen.getByText('200')).toBeInTheDocument()
      })
    })
  })

  describe('Item Detail Page', () => {
    it('renders item detail page with item content', async () => {
      render(<ItemDetail />, {
        routerProps: { initialEntries: ['/items/1'] },
        route: '/items/:id'
      })

      // Wait for the loading state to resolve
      await waitFor(() => {
        // Use getAllByText since related items may also show this title
        const elements = screen.getAllByText('Code Review Agent')
        expect(elements.length).toBeGreaterThan(0)
      })

      expect(screen.getByText('An AI agent that reviews code for best practices')).toBeInTheDocument()
    })

    it('displays item metadata correctly', async () => {
      render(<ItemDetail />, {
        routerProps: { initialEntries: ['/items/1'] },
        route: '/items/:id'
      })

      await waitFor(() => {
        // Type badge
        expect(screen.getByText('agent')).toBeInTheDocument()
        // Category
        expect(screen.getByText('AI Assistants')).toBeInTheDocument()
        // View count
        expect(screen.getByText('150 views')).toBeInTheDocument()
      })
    })

    it('displays item tags', async () => {
      render(<ItemDetail />, {
        routerProps: { initialEntries: ['/items/1'] },
        route: '/items/:id'
      })

      await waitFor(() => {
        // Use getAllByText since related items may also show these tags
        const pythonTags = screen.getAllByText('python')
        const typescriptTags = screen.getAllByText('typescript')
        expect(pythonTags.length).toBeGreaterThan(0)
        expect(typescriptTags.length).toBeGreaterThan(0)
      })
    })

    it('increments view count when page loads', async () => {
      render(<ItemDetail />, {
        routerProps: { initialEntries: ['/items/1'] },
        route: '/items/:id'
      })

      await waitFor(() => {
        expect(api.incrementViewCount).toHaveBeenCalledWith(1)
      })
    })

    it('fetches related items', async () => {
      render(<ItemDetail />, {
        routerProps: { initialEntries: ['/items/1'] },
        route: '/items/:id'
      })

      await waitFor(() => {
        expect(api.getRelatedItems).toHaveBeenCalledWith(1, 5)
      })
    })

    it('displays 404 page for invalid item ID', async () => {
      render(<ItemDetail />, {
        routerProps: { initialEntries: ['/items/invalid'] },
        route: '/items/:id'
      })

      expect(screen.getByText('404')).toBeInTheDocument()
      expect(screen.getByText('Item Not Found')).toBeInTheDocument()
    })

    it('displays 404 when item is not found', async () => {
      vi.mocked(api.getItem).mockRejectedValue({ response: { status: 404 } })

      render(<ItemDetail />, {
        routerProps: { initialEntries: ['/items/999'] },
        route: '/items/:id'
      })

      await waitFor(() => {
        expect(screen.getByText('404')).toBeInTheDocument()
      })
    })

    it('displays error state on API failure', async () => {
      vi.mocked(api.getItem).mockRejectedValue(new Error('Network error'))

      render(<ItemDetail />, {
        routerProps: { initialEntries: ['/items/1'] },
        route: '/items/:id'
      })

      await waitFor(() => {
        expect(screen.getByText('Failed to load item')).toBeInTheDocument()
      })
    })

    it('has back navigation button', async () => {
      render(<ItemDetail />, {
        routerProps: { initialEntries: ['/items/1'] },
        route: '/items/:id'
      })

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument()
      })
    })
  })
})
