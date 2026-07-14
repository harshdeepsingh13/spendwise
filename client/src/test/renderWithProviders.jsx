import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../theme/theme'

/**
 * Builds a wrapper that supplies the app's core context — React Query + the MUI theme —
 * for component tests. Retries are disabled so failed queries/mutations surface immediately
 * instead of retrying during the test.
 *
 * @param {object} [options]
 * @param {QueryClient} [options.queryClient] - Provide a client to inspect cache state; omit for a fresh one.
 * @returns {({ children: React.ReactNode }) => JSX.Element} Wrapper for RTL's `render(ui, { wrapper })`.
 */
export const createTestWrapper = ({ queryClient } = {}) => {
  const client = queryClient ?? new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </QueryClientProvider>
  )
}
