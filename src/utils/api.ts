import { projectId, publicAnonKey } from './supabase/info'

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c4c7235f`

// Demo user credentials for authentication
const DEMO_USERS = {
  'admin@company.com': { password: 'admin123', userId: 'admin-001' },
  'manager@company.com': { password: 'manager123', userId: 'manager-001' },
  'employee@company.com': { password: 'employee123', userId: 'employee-001' }
}

class ApiClient {
  private baseUrl: string
  private headers: HeadersInit

  constructor() {
    this.baseUrl = API_BASE_URL
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    }
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Health check
  async health() {
    return this.request('/health')
  }

  // Setup demo data
  async setup() {
    return this.request('/setup', { method: 'POST' })
  }

  // Authentication (demo implementation)
  async authenticateUser(email: string, password: string) {
    // For demo purposes, validate against hardcoded credentials
    const user = DEMO_USERS[email as keyof typeof DEMO_USERS]
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials')
    }

    // Fetch user details from backend
    return this.request(`/user/${email}`)
  }

  // Currency conversion
  async convertCurrency(from: string, to: string, amount: number) {
    return this.request(`/convert/${from}/${to}/${amount}`)
  }

  // Expenses
  async getExpenses(userId: string) {
    return this.request(`/expenses/${userId}`)
  }

  async createExpense(expenseData: any) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    })
  }

  // Approvals
  async getPendingApprovals(userId: string) {
    return this.request(`/approvals/${userId}`)
  }

  async processApproval(approvalId: string, status: 'approved' | 'rejected', comments?: string) {
    return this.request(`/approvals/${approvalId}`, {
      method: 'POST',
      body: JSON.stringify({ status, comments })
    })
  }

  // OCR
  async processReceipt(file: File) {
    const formData = new FormData()
    formData.append('receipt', file)

    return this.request('/ocr', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
        // Don't set Content-Type for FormData
      }
    })
  }
}

export const apiClient = new ApiClient()

// Initialize demo data on first load
export const initializeDemoData = async () => {
  try {
    console.log('Initializing expense management demo data...')
    const result = await apiClient.setup()
    console.log('Demo data initialized:', result)
    return result
  } catch (error) {
    console.error('Failed to initialize demo data:', error)
    throw error
  }
}