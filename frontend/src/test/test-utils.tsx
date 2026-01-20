import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, Routes, Route, type MemoryRouterProps } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { KeyboardShortcutsProvider } from '@/contexts/KeyboardShortcutsContext'
import { Toaster } from '@/components/ui/toaster'
import type { ReactElement, ReactNode } from 'react'

interface AllProvidersProps {
  children: ReactNode
  routerProps?: MemoryRouterProps
  route?: string // Optional route pattern for params
}

function AllProviders({ children, routerProps, route }: AllProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <KeyboardShortcutsProvider>
          <MemoryRouter {...routerProps}>
            {route ? (
              <Routes>
                <Route path={route} element={children} />
              </Routes>
            ) : (
              children
            )}
          </MemoryRouter>
          <Toaster />
        </KeyboardShortcutsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routerProps?: MemoryRouterProps
  route?: string // Route pattern, e.g., "/items/:id"
}

function customRender(
  ui: ReactElement,
  { routerProps, route, ...options }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders routerProps={routerProps} route={route}>{children}</AllProviders>
    ),
    ...options,
  })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { customRender as render }
