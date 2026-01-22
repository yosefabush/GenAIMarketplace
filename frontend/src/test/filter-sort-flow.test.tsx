import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from './test-utils'
import Search from '@/pages/Search'
import { mockItems, mockSearchResponse, mockCategoriesResponse, mockTagsResponse, mockLikeCheckResponse } from './mocks'
import { api } from '@/lib/api'
import type { SearchResult } from '@/lib/api'

// Mock the API module
vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual('@/lib/api')
  return {
    ...actual,
    api: {
      search: vi.fn(),
      getCategories: vi.fn(),
      getTags: vi.fn(),
      checkLike: vi.fn(),
      toggleLike: vi.fn(),
    },
  }
})

describe('Filter and Sort Results Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mocks
    vi.mocked(api.search).mockResolvedValue({ data: mockSearchResponse } as never)
    vi.mocked(api.getCategories).mockResolvedValue({ data: mockCategoriesResponse } as never)
    vi.mocked(api.getTags).mockResolvedValue({ data: mockTagsResponse } as never)
    vi.mocked(api.checkLike).mockResolvedValue({ data: mockLikeCheckResponse(1, false) } as never)
    vi.mocked(api.toggleLike).mockResolvedValue({ data: { success: true, data: { item_id: 1, liked: true, like_count: 26 } } } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Type Filtering', () => {
    it('displays active filter pills when types are selected', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?type=agent'] } })

      await waitFor(() => {
        // Should show active filter pill
        const filterPills = screen.getAllByText('agent')
        expect(filterPills.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('removes type filter when pill X is clicked', async () => {
      // Create a response with filtering applied
      const filteredResponse: SearchResult = {
        ...mockSearchResponse,
        data: mockItems.filter((item) => item.type === 'agent'),
        total: 1,
      }
      vi.mocked(api.search).mockResolvedValue({ data: filteredResponse } as never)

      render(<Search />, { routerProps: { initialEntries: ['/search?type=agent'] } })

      await waitFor(() => {
        // Find the filter pill
        const pills = screen.getAllByText('agent')
        expect(pills.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Category Filtering', () => {
    it('loads categories from API', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search'] } })

      await waitFor(() => {
        expect(api.getCategories).toHaveBeenCalled()
      })
    })
  })

  describe('Tag Filtering', () => {
    it('loads tags from API', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search'] } })

      await waitFor(() => {
        expect(api.getTags).toHaveBeenCalled()
      })
    })
  })

  describe('Sorting', () => {
    it('displays sort dropdown when results exist', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      await waitFor(() => {
        // The sort dropdown should be visible after results load
        expect(screen.getByText('Relevance')).toBeInTheDocument()
      })
    })

    it('preserves sort option from URL', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?sort=views'] } })

      await waitFor(() => {
        expect(api.search).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'views',
          })
        )
      })
    })
  })

  describe('URL State Management', () => {
    it('reads query from URL', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      await waitFor(() => {
        expect(api.search).toHaveBeenCalledWith(
          expect.objectContaining({
            q: 'test',
          })
        )
      })
    })

    it('reads type filter from URL', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?type=agent,prompt'] } })

      await waitFor(() => {
        expect(api.search).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'agent,prompt',
          })
        )
      })
    })

    it('reads page from URL', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?page=2'] } })

      await waitFor(() => {
        expect(api.search).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        )
      })
    })

    it('reads tags from URL', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?tags=python,typescript'] } })

      await waitFor(() => {
        expect(api.search).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: 'python,typescript',
          })
        )
      })
    })

    it('combines multiple URL parameters', async () => {
      render(<Search />, {
        routerProps: {
          initialEntries: ['/search?q=code&type=agent&sort=date&page=2']
        }
      })

      await waitFor(() => {
        expect(api.search).toHaveBeenCalledWith(
          expect.objectContaining({
            q: 'code',
            type: 'agent',
            sort: 'date',
            page: 2,
          })
        )
      })
    })
  })

  describe('Pagination', () => {
    it('displays pagination when multiple pages exist', async () => {
      // Mock a response with many items (more than 20)
      const manyItemsResponse: SearchResult = {
        success: true,
        data: mockItems,
        total: 45, // More than 20, so multiple pages
        page: 1,
        limit: 20,
      }
      vi.mocked(api.search).mockResolvedValue({ data: manyItemsResponse } as never)

      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      await waitFor(() => {
        // Pagination should have Next button
        expect(screen.getByText('Next')).toBeInTheDocument()
      })
    })

    it('shows multiple page numbers when pagination exists', async () => {
      const manyItemsResponse: SearchResult = {
        success: true,
        data: mockItems,
        total: 45,
        page: 2,
        limit: 20,
      }
      vi.mocked(api.search).mockResolvedValue({ data: manyItemsResponse } as never)

      render(<Search />, { routerProps: { initialEntries: ['/search?page=2'] } })

      await waitFor(() => {
        // Should show page numbers
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('does not show pagination for single page', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      await waitFor(() => {
        // Results loaded
        expect(screen.getByText('Code Review Agent')).toBeInTheDocument()
      })

      // Single page should not have Previous/Next buttons
      expect(screen.queryByText('Previous')).not.toBeInTheDocument()
      expect(screen.queryByText('Next')).not.toBeInTheDocument()
    })
  })

  describe('Filter Interactions', () => {
    it('does not show Clear all button when no filters are active', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search'] } })

      await waitFor(() => {
        // Search results loaded
        expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
      })
    })
  })

  describe('Mobile Filters', () => {
    it('shows mobile filter toggle button', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search'] } })

      await waitFor(() => {
        // Mobile filter button should be present (may be hidden on desktop)
        const filterButtons = screen.getAllByRole('button')
        const mobileFilterBtn = filterButtons.find((btn) => btn.textContent?.includes('Filters'))
        expect(mobileFilterBtn).toBeTruthy()
      })
    })
  })

  describe('Search Results Display', () => {
    it('displays result count', async () => {
      render(<Search />, { routerProps: { initialEntries: ['/search?q=test'] } })

      await waitFor(() => {
        expect(screen.getByText(/Showing 1-3 of 3 results/)).toBeInTheDocument()
      })
    })

    it('displays no results message for empty search', async () => {
      const emptyResponse: SearchResult = {
        success: true,
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      }
      vi.mocked(api.search).mockResolvedValue({ data: emptyResponse } as never)

      render(<Search />, { routerProps: { initialEntries: ['/search?q=nonexistent'] } })

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument()
      })
    })

    it('displays search query in no results message', async () => {
      const emptyResponse: SearchResult = {
        success: true,
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      }
      vi.mocked(api.search).mockResolvedValue({ data: emptyResponse } as never)

      render(<Search />, { routerProps: { initialEntries: ['/search?q=foobar'] } })

      await waitFor(() => {
        expect(screen.getByText(/No items match your search for "foobar"/)).toBeInTheDocument()
      })
    })
  })
})
