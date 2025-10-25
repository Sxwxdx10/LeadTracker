/**
 * Test data fixtures for E2E tests
 */

export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'Admin',
  },
  user: {
    email: 'user@test.com',
    password: 'User123!',
    firstName: 'Regular',
    lastName: 'User',
    role: 'User',
  },
  newUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User',
    organizationName: 'Test Org',
    organizationDomain: `test-org-${Date.now()}`,
  },
};

export const testLeads = {
  valid: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    company: 'Acme Corp',
    position: 'CEO',
    source: 'Website',
  },
  minimal: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
  },
  complete: {
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.j@techcorp.com',
    phone: '+1987654321',
    company: 'TechCorp',
    position: 'CTO',
    source: 'Referral',
    notes: 'Important lead - follow up ASAP',
    tags: ['vip', 'hot-lead'],
  },
};

export const testTasks = {
  valid: {
    title: 'Follow up call',
    description: 'Call the lead to discuss requirements',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  },
  urgent: {
    title: 'Urgent: Send proposal',
    description: 'Send the proposal document before EOD',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    priority: 'High',
  },
};

export const testComments = {
  simple: 'This is a test comment',
  detailed: 'Met with the client today. They are very interested in our product and want to schedule a demo next week.',
  followUp: 'Follow up scheduled for next Monday at 2 PM',
};

export const testOrganization = {
  name: 'Test Organization',
  domain: 'test-org',
  description: 'This is a test organization for E2E tests',
};

export const testStages = [
  { name: 'New', order: 0, color: '#3B82F6' },
  { name: 'Contacted', order: 1, color: '#10B981' },
  { name: 'Qualified', order: 2, color: '#F59E0B' },
  { name: 'Proposal', order: 3, color: '#8B5CF6' },
  { name: 'Negotiation', order: 4, color: '#EC4899' },
  { name: 'Won', order: 5, color: '#059669' },
  { name: 'Lost', order: 6, color: '#EF4444' },
];

