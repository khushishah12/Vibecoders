import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AuthProvider, useAuth } from './components/auth/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Navbar } from './components/layout/Navbar'
import { LoginPage } from './components/pages/LoginPage'
import { SignupPage } from './components/pages/SignupPage'
import { Dashboard } from './components/pages/Dashboard'
import { ExpenseForm } from './components/pages/ExpenseForm'
import { ApprovalsPage } from './components/pages/ApprovalsPage'
import { AdminPanel } from './components/pages/AdminPanel'
import { Toaster } from './components/ui/sonner'

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ExpenseManager...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        {currentPage === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            <LoginPage onNavigate={handleNavigate} />
          </motion.div>
        ) : (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <SignupPage onNavigate={handleNavigate} />
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />
      case 'expenses':
        return <ExpenseForm onNavigate={handleNavigate} />
      case 'approvals':
        return (
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <ApprovalsPage onNavigate={handleNavigate} />
          </ProtectedRoute>
        )
      case 'settings':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel onNavigate={handleNavigate} />
          </ProtectedRoute>
        )
      case 'profile':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-lg p-8"
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  Profile
                </h1>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )
      default:
        return <Dashboard onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentPage()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App