import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

const supabaseUrl = `https://${projectId}.supabase.co`
export const supabase = createClient(supabaseUrl, publicAnonKey)

// Database types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'employee'
  company_id: string
  manager_id?: string
  is_manager_approver: boolean
  created_at: string
}

export interface Company {
  id: string
  name: string
  country: string
  currency: string
  created_at: string
}

export interface Expense {
  id: string
  employee_id: string
  amount: number
  currency: string
  amount_in_company_currency: number
  category: string
  description: string
  date: string
  receipt_url?: string
  status: 'pending' | 'approved' | 'rejected'
  approval_steps: ApprovalStep[]
  created_at: string
  employee?: User
}

export interface ApprovalStep {
  id: string
  expense_id: string
  approver_id: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  sequence: number
  decided_at?: string
  approver?: User
}

export interface ApprovalRule {
  id: string
  company_id: string
  type: 'percentage' | 'specific' | 'hybrid'
  percentage?: number
  specific_approver_id?: string
  created_at: string
}

// Auth helpers
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return data
}

export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export const signUpUser = async (email: string, password: string, name: string, role: string = 'employee') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role
      }
    }
  })
  
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Currency conversion helper
export const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
  // For demo purposes, using fixed conversion rates
  // In production, you would integrate with a real currency API
  const conversionRates: Record<string, Record<string, number>> = {
    'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110, 'USD': 1 },
    'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 129, 'EUR': 1 },
    'GBP': { 'USD': 1.37, 'EUR': 1.16, 'JPY': 151, 'GBP': 1 },
    'JPY': { 'USD': 0.0091, 'EUR': 0.0077, 'GBP': 0.0066, 'JPY': 1 }
  }
  
  if (fromCurrency === toCurrency) return amount
  
  const rate = conversionRates[fromCurrency]?.[toCurrency] || 1
  return Math.round(amount * rate * 100) / 100
}