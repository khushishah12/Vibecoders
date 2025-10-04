import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '../../utils/supabase/client'
import { apiClient, initializeDemoData } from '../../utils/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize demo data on first load
        await initializeDemoData()
        
        // Check for stored user session
        const storedUser = localStorage.getItem('expense_user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    try {
      const userData = await apiClient.authenticateUser(email, password)
      setUser(userData)
      localStorage.setItem('expense_user', JSON.stringify(userData))
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const handleSignOut = async () => {
    try {
      setUser(null)
      localStorage.removeItem('expense_user')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const refreshUser = async () => {
    try {
      if (user?.email) {
        const userData = await apiClient.request(`/user/${user.email}`)
        setUser(userData)
        localStorage.setItem('expense_user', JSON.stringify(userData))
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
      localStorage.removeItem('expense_user')
    }
  }

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}