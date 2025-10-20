// Custom render utilities for testing with providers
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  // Create a new QueryClient for each test to ensure isolation
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { customRender as render }

// Additional test utilities
export const createMockFile = (
  name = 'test.csv',
  size = 1024,
  type = 'text/csv'
): File => {
  const blob = new Blob(['test content'], { type })
  return new File([blob], name, { type })
}

export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

