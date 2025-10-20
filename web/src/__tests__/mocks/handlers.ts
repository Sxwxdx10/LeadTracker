/**
 * @jest-environment node
 */

// Mock API handlers for testing
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'User',
  organizationId: 'org-1',
  isActive: true,
  emailConfirmed: true,
  createdAt: '2024-01-01T00:00:00Z',
}

export const mockOrganization = {
  id: 'org-1',
  name: 'Test Organization',
  slug: 'test-org',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
}

export const mockLead = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  company: 'Acme Corp',
  position: 'CEO',
  status: 'New',
  stageId: 'stage-1',
  score: 80,
  source: 'Website',
  assignedToId: '1',
  organizationId: 'org-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  tags: ['vip', 'hot-lead'],
}

export const mockStage = {
  id: 'stage-1',
  name: 'New',
  order: 0,
  organizationId: 'org-1',
  color: '#3B82F6',
}

export const mockTask = {
  id: '1',
  title: 'Follow up call',
  description: 'Call the lead to discuss requirements',
  dueDate: '2024-12-31T00:00:00Z',
  completed: false,
  leadId: '1',
  assignedToId: '1',
  organizationId: 'org-1',
  createdAt: '2024-01-01T00:00:00Z',
}

export const mockComment = {
  id: '1',
  content: 'This is a test comment',
  leadId: '1',
  userId: '1',
  user: mockUser,
  createdAt: '2024-01-01T00:00:00Z',
}

// Mock API responses
export const mockApiResponses = {
  login: {
    success: true,
    data: {
      token: 'mock-jwt-token',
      user: mockUser,
    },
  },
  register: {
    success: true,
    message: 'Registration successful',
  },
  getLeads: {
    success: true,
    data: [mockLead],
    pagination: {
      page: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
    },
  },
  getLead: {
    success: true,
    data: mockLead,
  },
  createLead: {
    success: true,
    data: mockLead,
  },
  updateLead: {
    success: true,
    data: mockLead,
  },
  deleteLead: {
    success: true,
    message: 'Lead deleted successfully',
  },
}

