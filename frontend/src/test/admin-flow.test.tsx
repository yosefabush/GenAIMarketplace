import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from './test-utils'
import userEvent from '@testing-library/user-event'
import AdminLogin from '@/pages/admin/Login'
import AdminEditor from '@/pages/admin/Editor'
import { mockCategoriesResponse, mockTagsResponse } from './mocks'
import { api } from '@/lib/api'

// Mock the API module
vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual('@/lib/api')
  return {
    ...actual,
    api: {
      validateToken: vi.fn(),
      createItem: vi.fn(),
      updateItem: vi.fn(),
      getItem: vi.fn(),
      getCategories: vi.fn(),
      getTags: vi.fn(),
    },
  }
})

// Mock the navigate function
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Admin Login Flow', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the login page with token input', async () => {
    render(<AdminLogin />, { routerProps: { initialEntries: ['/admin/login'] } })

    expect(screen.getByText('Admin Login')).toBeInTheDocument()
    expect(screen.getByLabelText('Admin Token')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
  })

  it('shows error when submitting empty token', async () => {
    render(<AdminLogin />, { routerProps: { initialEntries: ['/admin/login'] } })

    const loginButton = screen.getByRole('button', { name: 'Login' })
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter an admin token')).toBeInTheDocument()
    })
  })

  it('shows error for invalid token', async () => {
    vi.mocked(api.validateToken).mockRejectedValue({ response: { status: 401 } })

    render(<AdminLogin />, { routerProps: { initialEntries: ['/admin/login'] } })

    const tokenInput = screen.getByLabelText('Admin Token')
    await user.type(tokenInput, 'invalid-token')

    const loginButton = screen.getByRole('button', { name: 'Login' })
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid admin token')).toBeInTheDocument()
    })
  })

  it('redirects to dashboard on successful login', async () => {
    vi.mocked(api.validateToken).mockResolvedValue({
      data: { success: true, valid: true, message: 'Token is valid' },
    } as never)

    render(<AdminLogin />, { routerProps: { initialEntries: ['/admin/login'] } })

    const tokenInput = screen.getByLabelText('Admin Token')
    await user.type(tokenInput, 'valid-token')

    const loginButton = screen.getByRole('button', { name: 'Login' })
    await user.click(loginButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard')
    })
  })

  it('stores token in localStorage on successful login', async () => {
    vi.mocked(api.validateToken).mockResolvedValue({
      data: { success: true, valid: true, message: 'Token is valid' },
    } as never)

    render(<AdminLogin />, { routerProps: { initialEntries: ['/admin/login'] } })

    const tokenInput = screen.getByLabelText('Admin Token')
    await user.type(tokenInput, 'valid-token')

    const loginButton = screen.getByRole('button', { name: 'Login' })
    await user.click(loginButton)

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('admin_token', 'valid-token')
    })
  })

  it('shows loading state while validating', async () => {
    vi.mocked(api.validateToken).mockImplementation(() =>
      new Promise((resolve) => setTimeout(() => resolve({
        data: { success: true, valid: true, message: 'Token is valid' },
      } as never), 100))
    )

    render(<AdminLogin />, { routerProps: { initialEntries: ['/admin/login'] } })

    const tokenInput = screen.getByLabelText('Admin Token')
    await user.type(tokenInput, 'valid-token')

    const loginButton = screen.getByRole('button', { name: 'Login' })
    await user.click(loginButton)

    expect(screen.getByText('Validating...')).toBeInTheDocument()
  })

  it('shows back to marketplace link', () => {
    render(<AdminLogin />, { routerProps: { initialEntries: ['/admin/login'] } })

    expect(screen.getByText('Back to marketplace')).toBeInTheDocument()
  })
})

describe('Admin Create Item Flow', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Set up as authenticated
    window.localStorage.setItem('admin_token', 'valid-token')
    vi.mocked(api.getCategories).mockResolvedValue({ data: mockCategoriesResponse } as never)
    vi.mocked(api.getTags).mockResolvedValue({ data: mockTagsResponse } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('renders the editor page for new item', async () => {
    render(<AdminEditor />, { routerProps: { initialEntries: ['/admin/editor'] } })

    await waitFor(() => {
      expect(screen.getByText('New Item')).toBeInTheDocument()
    })
  })

  it('shows required form fields', async () => {
    render(<AdminEditor />, { routerProps: { initialEntries: ['/admin/editor'] } })

    await waitFor(() => {
      // Title field
      expect(screen.getByLabelText(/Title/)).toBeInTheDocument()
      // Description field
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
      // Type selector
      expect(screen.getByText('Select a type')).toBeInTheDocument()
    })
  })

  it('shows validation errors for empty required fields', async () => {
    render(<AdminEditor />, { routerProps: { initialEntries: ['/admin/editor'] } })

    await waitFor(() => {
      expect(screen.getByText('New Item')).toBeInTheDocument()
    })

    // Click submit without filling required fields
    const submitButton = screen.getByRole('button', { name: 'Create Item' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
      expect(screen.getByText('Description is required')).toBeInTheDocument()
      expect(screen.getByText('Type is required')).toBeInTheDocument()
    })
  })

  it('clears validation errors when user starts typing', async () => {
    render(<AdminEditor />, { routerProps: { initialEntries: ['/admin/editor'] } })

    await waitFor(() => {
      expect(screen.getByText('New Item')).toBeInTheDocument()
    })

    // Submit to trigger errors
    const submitButton = screen.getByRole('button', { name: 'Create Item' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })

    // Start typing in title field
    const titleInput = screen.getByLabelText(/Title/)
    await user.type(titleInput, 'Test Title')

    // Title error should be cleared
    expect(screen.queryByText('Title is required')).not.toBeInTheDocument()
  })

  it('navigates back to dashboard on cancel', async () => {
    render(<AdminEditor />, { routerProps: { initialEntries: ['/admin/editor'] } })

    await waitFor(() => {
      expect(screen.getByText('New Item')).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('loads categories from API', async () => {
    render(<AdminEditor />, { routerProps: { initialEntries: ['/admin/editor'] } })

    await waitFor(() => {
      expect(api.getCategories).toHaveBeenCalled()
    })
  })

  it('has save and cancel buttons', async () => {
    render(<AdminEditor />, { routerProps: { initialEntries: ['/admin/editor'] } })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create Item' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })
  })

  it('shows character count for description', async () => {
    render(<AdminEditor />, { routerProps: { initialEntries: ['/admin/editor'] } })

    await waitFor(() => {
      expect(screen.getByText('0/1000 characters')).toBeInTheDocument()
    })
  })

  it('updates character count when typing in description', async () => {
    render(<AdminEditor />, { routerProps: { initialEntries: ['/admin/editor'] } })

    await waitFor(() => {
      expect(screen.getByText('0/1000 characters')).toBeInTheDocument()
    })

    const descriptionInput = screen.getByLabelText(/Description/)
    await user.type(descriptionInput, 'Hello World')

    await waitFor(() => {
      expect(screen.getByText('11/1000 characters')).toBeInTheDocument()
    })
  })
})
