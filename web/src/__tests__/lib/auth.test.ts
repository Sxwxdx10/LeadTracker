import axios from 'axios'
import { mockUser, mockOrganization } from '@/__tests__/mocks/handlers'

// Mock axios before importing
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Create mock axios instance
const mockAxiosInstance = {
  post: jest.fn(),
  interceptors: {
    response: { use: jest.fn(), eject: jest.fn() },
  },
}

mockedAxios.create = jest.fn(() => mockAxiosInstance as any)

// Import after mocking
const { authApi, tokenUtils } = require('@/lib/auth')

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

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' }
      const mockResponse = {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresAt: '2024-12-31T23:59:59Z',
          user: mockUser,
          organization: mockOrganization,
        },
      }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await authApi.login(credentials)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/login', credentials)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle login errors', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' }
      mockAxiosInstance.post.mockRejectedValue(new Error('Invalid credentials'))
      
      await expect(authApi.login(credentials)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('register', () => {
    it('should register a new user', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        organizationName: 'New Org',
      }
      const mockResponse = {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresAt: '2024-12-31T23:59:59Z',
          user: mockUser,
          organization: mockOrganization,
        },
      }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await authApi.register(registerData)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/register', registerData)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const refreshToken = 'old-refresh-token'
      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresAt: '2024-12-31T23:59:59Z',
        },
      }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await authApi.refreshToken(refreshToken)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/refresh', { refreshToken })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('requestPasswordReset', () => {
    it('should request password reset', async () => {
      const data = { email: 'test@example.com' }
      mockAxiosInstance.post.mockResolvedValue({})
      
      await authApi.requestPasswordReset(data)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/forgot-password', data)
    })
  })

  describe('confirmPasswordReset', () => {
    it('should confirm password reset', async () => {
      const data = { 
        email: 'test@example.com', 
        token: 'reset-token', 
        newPassword: 'newPassword123' 
      }
      mockAxiosInstance.post.mockResolvedValue({})
      
      await authApi.confirmPasswordReset(data)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/reset-password', data)
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const refreshToken = 'refresh-token'
      mockAxiosInstance.post.mockResolvedValue({})
      
      await authApi.logout(refreshToken)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/logout', { refreshToken })
    })

    it('should handle logout errors gracefully', async () => {
      const refreshToken = 'refresh-token'
      mockAxiosInstance.post.mockRejectedValue(new Error('Server error'))
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Should not throw
      await expect(authApi.logout(refreshToken)).resolves.toBeUndefined()
      expect(consoleWarnSpy).toHaveBeenCalled()
      
      consoleWarnSpy.mockRestore()
    })
  })
})

describe('tokenUtils', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('saveTokens', () => {
    it('should save auth response to localStorage', () => {
      const authResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: '2024-12-31T23:59:59Z',
        user: mockUser,
        organization: mockOrganization,
      }
      
      tokenUtils.saveTokens(authResponse)
      
      expect(localStorageMock.getItem('accessToken')).toBe('access-token')
      expect(localStorageMock.getItem('refreshToken')).toBe('refresh-token')
      expect(localStorageMock.getItem('tokenExpiry')).toBe('2024-12-31T23:59:59Z')
      expect(localStorageMock.getItem('user')).toBe(JSON.stringify(mockUser))
      expect(localStorageMock.getItem('organization')).toBe(JSON.stringify(mockOrganization))
    })
  })

  describe('getAccessToken', () => {
    it('should retrieve access token', () => {
      localStorageMock.setItem('accessToken', 'test-token')
      expect(tokenUtils.getAccessToken()).toBe('test-token')
    })

    it('should return null if no token exists', () => {
      expect(tokenUtils.getAccessToken()).toBe(null)
    })
  })

  describe('getRefreshToken', () => {
    it('should retrieve refresh token', () => {
      localStorageMock.setItem('refreshToken', 'refresh-token')
      expect(tokenUtils.getRefreshToken()).toBe('refresh-token')
    })

    it('should return null if no token exists', () => {
      expect(tokenUtils.getRefreshToken()).toBe(null)
    })
  })

  describe('getUser', () => {
    it('should retrieve and parse user data', () => {
      localStorageMock.setItem('user', JSON.stringify(mockUser))
      const user = tokenUtils.getUser()
      expect(user).toEqual(mockUser)
    })

    it('should return null if no user data exists', () => {
      expect(tokenUtils.getUser()).toBe(null)
    })
  })

  describe('getOrganization', () => {
    it('should retrieve and parse organization data', () => {
      localStorageMock.setItem('organization', JSON.stringify(mockOrganization))
      const org = tokenUtils.getOrganization()
      expect(org).toEqual(mockOrganization)
    })

    it('should return null if no organization data exists', () => {
      expect(tokenUtils.getOrganization()).toBe(null)
    })
  })

  describe('isTokenExpired', () => {
    it('should return true if token is expired', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      localStorageMock.setItem('tokenExpiry', pastDate.toISOString())
      expect(tokenUtils.isTokenExpired()).toBe(true)
    })

    it('should return false if token is not expired', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60) // 1 hour from now
      localStorageMock.setItem('tokenExpiry', futureDate.toISOString())
      expect(tokenUtils.isTokenExpired()).toBe(false)
    })

    it('should return true if no expiry exists', () => {
      expect(tokenUtils.isTokenExpired()).toBe(true)
    })
  })

  describe('clearTokens', () => {
    it('should clear all auth data from localStorage', () => {
      localStorageMock.setItem('accessToken', 'token')
      localStorageMock.setItem('refreshToken', 'token')
      localStorageMock.setItem('user', JSON.stringify(mockUser))
      localStorageMock.setItem('organization', JSON.stringify(mockOrganization))
      localStorageMock.setItem('tokenExpiry', '2024-12-31T23:59:59Z')
      
      tokenUtils.clearTokens()
      
      expect(localStorageMock.getItem('accessToken')).toBe(null)
      expect(localStorageMock.getItem('refreshToken')).toBe(null)
      expect(localStorageMock.getItem('user')).toBe(null)
      expect(localStorageMock.getItem('organization')).toBe(null)
      expect(localStorageMock.getItem('tokenExpiry')).toBe(null)
    })
  })
})

