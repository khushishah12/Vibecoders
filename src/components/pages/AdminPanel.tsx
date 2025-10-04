import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../auth/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Users, Settings, Building, DollarSign, UserPlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface User {
  id: string
  name: string
  email: string
  role: 'employee' | 'manager' | 'admin'
  managerId?: string
  companyId: string
  createdAt: string
}

interface Company {
  id: string
  name: string
  country: string
  currency: string
  createdAt: string
}

interface ApprovalRule {
  id: string
  name: string
  type: 'percentage' | 'specific' | 'hybrid'
  threshold?: number
  requiredApprovers?: string[]
  amountLimit?: number
  companyId: string
}

export const AdminPanel: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([])
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee', managerId: '' })
  const [newRule, setNewRule] = useState({ 
    name: '', 
    type: 'percentage' as const, 
    threshold: 60, 
    amountLimit: 1000 
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load company data
      const companyResponse = await fetch(`https://${await import('../../utils/supabase/info').then(m => m.projectId)}.supabase.co/functions/v1/make-server-c4c7235f/company`, {
        headers: {
          'Authorization': `Bearer ${await import('../../utils/supabase/info').then(m => m.publicAnonKey)}`
        }
      })
      if (companyResponse.ok) {
        const companyData = await companyResponse.json()
        setCompany(companyData)
      }

      // Load users
      const usersResponse = await fetch(`https://${await import('../../utils/supabase/info').then(m => m.projectId)}.supabase.co/functions/v1/make-server-c4c7235f/users`, {
        headers: {
          'Authorization': `Bearer ${await import('../../utils/supabase/info').then(m => m.publicAnonKey)}`
        }
      })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // Load approval rules
      const rulesResponse = await fetch(`https://${await import('../../utils/supabase/info').then(m => m.projectId)}.supabase.co/functions/v1/make-server-c4c7235f/approval-rules`, {
        headers: {
          'Authorization': `Bearer ${await import('../../utils/supabase/info').then(m => m.publicAnonKey)}`
        }
      })
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json()
        setApprovalRules(rulesData)
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`https://${await import('../../utils/supabase/info').then(m => m.projectId)}.supabase.co/functions/v1/make-server-c4c7235f/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await import('../../utils/supabase/info').then(m => m.publicAnonKey)}`
        },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        toast.success('User created successfully')
        setNewUser({ name: '', email: '', role: 'employee', managerId: '' })
        loadData()
      } else {
        toast.error('Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Failed to create user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`https://${await import('../../utils/supabase/info').then(m => m.projectId)}.supabase.co/functions/v1/make-server-c4c7235f/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await import('../../utils/supabase/info').then(m => m.publicAnonKey)}`
        }
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        loadData()
      } else {
        toast.error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const handleCreateApprovalRule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`https://${await import('../../utils/supabase/info').then(m => m.projectId)}.supabase.co/functions/v1/make-server-c4c7235f/approval-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await import('../../utils/supabase/info').then(m => m.publicAnonKey)}`
        },
        body: JSON.stringify(newRule)
      })

      if (response.ok) {
        toast.success('Approval rule created successfully')
        setNewRule({ name: '', type: 'percentage', threshold: 60, amountLimit: 1000 })
        loadData()
      } else {
        toast.error('Failed to create approval rule')
      }
    } catch (error) {
      console.error('Error creating approval rule:', error)
      toast.error('Failed to create approval rule')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const managers = users.filter(u => u.role === 'manager')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">Manage users, approval rules, and company settings</p>
            </div>
            <Button onClick={() => onNavigate('dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="approval-rules" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Approval Rules
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Create New User
                    </CardTitle>
                    <CardDescription>
                      Add employees and managers to your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select 
                          value={newUser.role} 
                          onValueChange={(value) => setNewUser({ ...newUser, role: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newUser.role === 'employee' && (
                        <div>
                          <Label htmlFor="manager">Manager</Label>
                          <Select 
                            value={newUser.managerId} 
                            onValueChange={(value) => setNewUser({ ...newUser, managerId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                            <SelectContent>
                              {managers.map(manager => (
                                <SelectItem key={manager.id} value={manager.id}>
                                  {manager.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button type="submit" className="w-full">
                        Create User
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Users</CardTitle>
                    <CardDescription>
                      Manage current organization members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'manager' ? 'secondary' : 'outline'}>
                              {user.role}
                            </Badge>
                          </div>
                          {user.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="approval-rules">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Approval Rule</CardTitle>
                    <CardDescription>
                      Set up automated approval workflows
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateApprovalRule} className="space-y-4">
                      <div>
                        <Label htmlFor="ruleName">Rule Name</Label>
                        <Input
                          id="ruleName"
                          value={newRule.name}
                          onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                          placeholder="e.g., High Value Expenses"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="ruleType">Rule Type</Label>
                        <Select 
                          value={newRule.type} 
                          onValueChange={(value) => setNewRule({ ...newRule, type: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage Based</SelectItem>
                            <SelectItem value="specific">Specific Approver</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newRule.type === 'percentage' && (
                        <div>
                          <Label htmlFor="threshold">Approval Threshold (%)</Label>
                          <Input
                            id="threshold"
                            type="number"
                            min="1"
                            max="100"
                            value={newRule.threshold}
                            onChange={(e) => setNewRule({ ...newRule, threshold: parseInt(e.target.value) })}
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="amountLimit">Amount Limit ($)</Label>
                        <Input
                          id="amountLimit"
                          type="number"
                          min="0"
                          value={newRule.amountLimit}
                          onChange={(e) => setNewRule({ ...newRule, amountLimit: parseInt(e.target.value) })}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Create Rule
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Approval Rules</CardTitle>
                    <CardDescription>
                      Current automation rules in effect
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {approvalRules.map(rule => (
                        <div key={rule.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{rule.name}</h4>
                            <Badge>{rule.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {rule.type === 'percentage' && `${rule.threshold}% approval required`}
                            {rule.amountLimit && ` • Max: $${rule.amountLimit}`}
                          </p>
                        </div>
                      ))}
                      {approvalRules.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          No approval rules configured yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    View and update company details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {company ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Company Name</Label>
                        <p className="mt-1 p-2 bg-gray-50 rounded">{company.name}</p>
                      </div>
                      <div>
                        <Label>Country</Label>
                        <p className="mt-1 p-2 bg-gray-50 rounded">{company.country}</p>
                      </div>
                      <div>
                        <Label>Currency</Label>
                        <p className="mt-1 p-2 bg-gray-50 rounded">{company.currency}</p>
                      </div>
                      <div>
                        <Label>Created</Label>
                        <p className="mt-1 p-2 bg-gray-50 rounded">
                          {new Date(company.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No company information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{users.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Approval Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{approvalRules.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Managers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{managers.length}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}