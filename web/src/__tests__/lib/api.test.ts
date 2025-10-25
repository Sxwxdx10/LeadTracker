import axios from 'axios'
import { mockLead, mockStage, mockApiResponses } from '@/__tests__/mocks/handlers'

// Mock axios before importing the api module
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Create mock axios instance
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
}

mockedAxios.create = jest.fn(() => mockAxiosInstance as any)

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
})

// Import API after mocking
const { leadsApi, stagesApi } = require('@/lib/api')

describe('leadsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  describe('getLeads', () => {
    it('should fetch paginated leads', async () => {
      const mockResponse = {
        data: mockApiResponses.getLeads,
      }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await leadsApi.getLeads({ page: 1, pageSize: 10 })
      
      expect(result).toEqual(mockApiResponses.getLeads)
    })

    it('should handle query parameters correctly', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockApiResponses.getLeads })
      
      await leadsApi.getLeads({
        page: 2,
        pageSize: 20,
        searchTerm: 'test',
        stageId: 'stage-1',
        sortBy: 'name',
        sortDirection: 'asc',
      })
      
      expect(mockAxiosInstance.get).toHaveBeenCalled()
      const callArg = mockAxiosInstance.get.mock.calls[0][0]
      expect(callArg).toContain('pageNumber=2')
      expect(callArg).toContain('pageSize=20')
      expect(callArg).toContain('searchTerm=test')
      expect(callArg).toContain('stageId=stage-1')
      expect(callArg).toContain('sortBy=name')
      expect(callArg).toContain('sortDirection=asc')
    })
  })

  describe('getLead', () => {
    it('should fetch a single lead by ID', async () => {
      const mockResponse = { data: mockLead }
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await leadsApi.getLead('1')
      
      expect(result).toEqual(mockLead)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/leads/1')
    })
  })

  describe('createLead', () => {
    it('should create a new lead', async () => {
      const newLead = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        company: 'Test Corp',
      }
      const mockResponse = { data: { ...mockLead, ...newLead } }
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await leadsApi.createLead(newLead)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/leads', newLead)
      expect(result).toMatchObject(newLead)
    })
  })

  describe('updateLead', () => {
    it('should update an existing lead', async () => {
      const updates = { firstName: 'Updated' }
      const mockResponse = { data: { ...mockLead, ...updates } }
      mockAxiosInstance.put.mockResolvedValue(mockResponse)
      
      const result = await leadsApi.updateLead('1', updates)
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/api/leads/1', updates)
      expect(result.firstName).toBe('Updated')
    })
  })

  describe('deleteLead', () => {
    it('should delete a lead', async () => {
      mockAxiosInstance.delete.mockResolvedValue({})
      
      await leadsApi.deleteLead('1')
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/leads/1')
    })
  })

  describe('getLeadStats', () => {
    it('should fetch lead statistics', async () => {
      const mockStats = {
        total: 100,
        new: 20,
        contacted: 30,
        qualified: 25,
        converted: 25,
      }
      const mockResponse = { data: mockStats }
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await leadsApi.getLeadStats()
      
      expect(result).toEqual(mockStats)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/leads/stats')
    })
  })
})

describe('stagesApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getStages', () => {
    it('should fetch all stages', async () => {
      const mockStages = [mockStage]
      const mockResponse = { data: mockStages }
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await stagesApi.getStages()
      
      expect(result).toEqual(mockStages)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/stages')
    })
  })

  describe('getStage', () => {
    it('should fetch a single stage by ID', async () => {
      const mockResponse = { data: mockStage }
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await stagesApi.getStage('stage-1')
      
      expect(result).toEqual(mockStage)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/stages/stage-1')
    })
  })
})

