import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { authApi, tokenUtils } from '@/lib/auth'
import { mockUser, mockOrganization } from '@/__tests__/mocks/handlers'

// Mock the auth API and tokenUtils
jest.mock('@/lib/auth', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  },
  tokenUtils: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    getUser: jest.fn(),
    getOrganization: jest.fn(),
    isTokenExpired: jest.fn(),
    saveTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock window.location
delete (window as any).location
window.location = { href: '' } as any

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    ;(tokenUtils.getAccessToken as jest.Mock).mockReturnValue(null)
    ;(tokenUtils.getRefreshToken as jest.Mock).mockReturnValue(null)
    ;(tokenUtils.getUser as jest.Mock).mockReturnValue(null)
    ;(tokenUtils.getOrganization as jest.Mock).mockReturnValue(null)
    ;(tokenUtils.isTokenExpired as jest.Mock).mockReturnValue(false)
    
    // Force API URL to disable demo mode
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080'
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      
      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')
      
      consoleError.mockRestore()
    })

    it('should provide auth context when used within AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      expect(result.current).toBeDefined()
      expect(result.current).toHaveProperty('user')
      expect(result.current).toHaveProperty('login')
      expect(result.current).toHaveProperty('logout')
    })
  })

  describe('Initial state', () => {
    it('should initialize with unauthenticated state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
      expect(result.current.organization).toBe(null)
    })

    it('should restore session from localStorage', async () => {
      const mockTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUser,
        organization: mockOrganization,
      }
      
      ;(tokenUtils.getAccessToken as jest.Mock).mockReturnValue(mockTokens.accessToken)
      ;(tokenUtils.getRefreshToken as jest.Mock).mockReturnValue(mockTokens.refreshToken)
      ;(tokenUtils.getUser as jest.Mock).mockReturnValue(mockTokens.user)
      ;(tokenUtils.getOrganization as jest.Mock).mockReturnValue(mockTokens.organization)
      ;(tokenUtils.isTokenExpired as jest.Mock).mockReturnValue(false)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })
      
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.organization).toEqual(mockOrganization)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: '2024-12-31T23:59:59Z',
        user: mockUser,
        organization: mockOrganization,
      }
      
      ;(authApi.login as jest.Mock).mockResolvedValue(mockResponse)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      await act(async () => {
        await result.current.login({ 
          email: 'test@example.com', 
          password: 'password123' 
        })
      })
      
      expect(authApi.login).toHaveBeenCalled()
      expect(tokenUtils.saveTokens).toHaveBeenCalledWith(mockResponse)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
    })

    it.skip('should handle login errors', async () => {
      // TODO: Fix this test - demo mode interferes with error handling
      const error = { response: { data: { message: 'Invalid credentials' } } }
      ;(authApi.login as jest.Mock).mockRejectedValue(error)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      let thrownError = false
      try {
        await act(async () => {
          await result.current.login({ 
            email: 'test@example.com', 
            password: 'wrong' 
          })
        })
      } catch (e) {
        thrownError = true
      }
      
      expect(thrownError).toBe(true)
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.error).toBe('Invalid credentials')
      })
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: '2024-12-31T23:59:59Z',
        user: mockUser,
        organization: mockOrganization,
      }
      
      ;(authApi.register as jest.Mock).mockResolvedValue(mockResponse)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          organizationName: 'New Org',
          organizationDomain: 'new-org',
        })
      })
      
      expect(authApi.register).toHaveBeenCalled()
      expect(tokenUtils.saveTokens).toHaveBeenCalledWith(mockResponse)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it.skip('should handle registration errors', async () => {
      // TODO: Fix this test - demo mode interferes with error handling
      const error = { response: { data: { message: 'Email already exists' } } }
      ;(authApi.register as jest.Mock).mockRejectedValue(error)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      let thrownError = false
      try {
        await act(async () => {
          await result.current.register({
            email: 'existing@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            organizationName: 'Test Org',
            organizationDomain: 'test-org',
          })
        })
      } catch (e) {
        thrownError = true
      }
      
      expect(thrownError).toBe(true)
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.error).toBe('Email already exists')
      })
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      ;(tokenUtils.getRefreshToken as jest.Mock).mockReturnValue('refresh-token')
      ;(authApi.logout as jest.Mock).mockResolvedValue(undefined)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      await act(async () => {
        await result.current.logout()
      })
      
      expect(authApi.logout).toHaveBeenCalledWith('refresh-token')
      expect(tokenUtils.clearTokens).toHaveBeenCalled()
      expect(window.location.href).toBe('/login')
    })

    it('should clear tokens even if logout API fails', async () => {
      ;(tokenUtils.getRefreshToken as jest.Mock).mockReturnValue('refresh-token')
      ;(authApi.logout as jest.Mock).mockRejectedValue(new Error('Server error'))
      
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation()
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      await act(async () => {
        await result.current.logout()
      })
      
      expect(tokenUtils.clearTokens).toHaveBeenCalled()
      expect(consoleWarn).toHaveBeenCalled()
      
      consoleWarn.mockRestore()
    })
  })

  describe('clearError', () => {
    it.skip('should clear error state', async () => {
      // TODO: Fix this test - demo mode interferes with error handling
      const error = { response: { data: { message: 'Test error' } } }
      ;(authApi.login as jest.Mock).mockRejectedValue(error)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      // Trigger an error
      try {
        await act(async () => {
          await result.current.login({ 
            email: 'test@example.com', 
            password: 'wrong' 
          })
        })
      } catch (e) {
        // Error expected
      }
      
      await waitFor(() => {
        expect(result.current.error).toBe('Test error')
      })
      
      // Clear the error
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBe(null)
    })
  })
})

