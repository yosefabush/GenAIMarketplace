import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { KeyboardShortcutsProvider } from './contexts/KeyboardShortcutsContext'
import { Toaster } from './components/ui/toaster'
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <KeyboardShortcutsProvider>
          <RouterProvider router={router} />
          <KeyboardShortcutsHelp />
          <Toaster />
        </KeyboardShortcutsProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
