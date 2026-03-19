import { CssBaseline, ThemeProvider } from '@mui/material'
import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { appTheme } from '@/theme'

export function renderWithProviders(ui: ReactElement, options?: { withRouter?: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const content = options?.withRouter === false ? ui : <MemoryRouter>{ui}</MemoryRouter>

  return render(
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {content}
      </QueryClientProvider>
    </ThemeProvider>,
  )
}
