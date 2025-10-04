import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../auth/AuthContext'
import { supabase, ApprovalStep, Expense } from '../../utils/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  DollarSign,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner@2.0.3'

interface ApprovalsPageProps {
  onNavigate: (page: string) => void
}

interface PendingApproval extends ApprovalStep {
  expense: Expense
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth()
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [comments, setComments] = useState('')

  useEffect(() => {
    if (user && (user.role === 'manager' || user.role === 'admin')) {
      fetchPendingApprovals()
    }
  }, [user])

  const fetchPendingApprovals = async () => {
    try {
      const { apiClient } = await import('../../utils/api')
      const data = await apiClient.getPendingApprovals(user?.id || '')
      setApprovals(data || [])
    } catch (error) {
      console.error('Error fetching approvals:', error)
      toast.error('Failed to load pending approvals')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    setProcessingId(approvalId)
    
    try {
      const { apiClient } = await import('../../utils/api')
      await apiClient.processApproval(approvalId, status, comments)

      // Refresh the list
      await fetchPendingApprovals()
      
      // Reset form
      setSelectedApproval(null)
      setComments('')
      
      toast.success(`Expense ${status} successfully!`)
    } catch (error) {
      console.error('Error processing approval:', error)
      toast.error('Failed to process approval')
    } finally {
      setProcessingId(null)
    }
  }

  const updateExpenseStatus = async (expenseId: string, approvalStatus: 'approved' | 'rejected') => {
    try {
      // For simplicity, we'll update the expense status directly
      // In a real system, you'd check all approval steps and apply approval rules
      const { error } = await supabase
        .from('expenses')
        .update({ status: approvalStatus })
        .eq('id', expenseId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating expense status:', error)
    }
  }

  const openApprovalModal = (approval: PendingApproval) => {
    setSelectedApproval(approval)
    setComments('')
  }

  const closeApprovalModal = () => {
    setSelectedApproval(null)
    setComments('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user?.role !== 'manager' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="p-8">
          <CardContent className="text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              Only managers and admins can access the approvals page.
            </p>
            <Button onClick={() => onNavigate('dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pending Approvals
          </h1>
          <p className="text-gray-600">
            Review and approve expense reports submitted by your team
          </p>
        </motion.div>

        {/* Approvals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {approvals.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-gray-600 mb-4">
                  There are no pending approvals at the moment.
                </p>
                <Button onClick={() => onNavigate('dashboard')}>
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {approvals.map((approval, index) => (
                <motion.div
                  key={approval.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          {approval.expense.description}
                        </CardTitle>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Employee</p>
                            <p className="text-sm text-gray-600">
                              {approval.expense.employee?.name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Amount</p>
                            <p className="text-sm text-gray-600">
                              {approval.expense.currency} {approval.expense.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Date</p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(approval.expense.date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">Category</p>
                            <p className="text-sm text-gray-600">
                              {approval.expense.category}
                            </p>
                          </div>
                        </div>
                      </div>

                      {approval.expense.receipt_url && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Receipt</p>
                          <a
                            href={approval.expense.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            View Receipt
                          </a>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <Button
                          onClick={() => openApprovalModal(approval)}
                          disabled={processingId === approval.id}
                          className="flex-1"
                          variant="outline"
                        >
                          {processingId === approval.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Review
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => handleApproval(approval.id, 'approved')}
                          disabled={processingId === approval.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {processingId === approval.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => handleApproval(approval.id, 'rejected')}
                          disabled={processingId === approval.id}
                          variant="destructive"
                          className="flex-1"
                        >
                          {processingId === approval.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Approval Modal */}
        {selectedApproval && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={closeApprovalModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">
                  Review Expense: {selectedApproval.expense.description}
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Comments (Optional)
                  </label>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add any comments about this approval..."
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={closeApprovalModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={() => handleApproval(selectedApproval.id, 'approved')}
                    disabled={processingId === selectedApproval.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processingId === selectedApproval.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleApproval(selectedApproval.id, 'rejected')}
                    disabled={processingId === selectedApproval.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processingId === selectedApproval.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}