import React, { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../../utils/supabase/client'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Alert, AlertDescription } from '../ui/alert'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { OCRReceiptUpload } from './OCRReceiptUpload'
import { CurrencyConverter } from './CurrencyConverter'
import { 
  Upload, 
  FileText, 
  DollarSign, 
  Calendar,
  Camera,
  CheckCircle,
  Scan,
  Repeat
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface ExpenseFormProps {
  onNavigate: (page: string) => void
}

const categories = [
  'Travel',
  'Meals & Entertainment',
  'Office Supplies',
  'Software & Subscriptions',
  'Training & Education',
  'Transportation',
  'Accommodation',
  'Marketing',
  'Other'
]

const currencies = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'
]

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onNavigate }) => {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showOCR, setShowOCR] = useState(false)
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false)
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receiptFile: null as File | null
  })

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleFileUpload = async (file: File): Promise<string | null> => {
    if (!file) return null

    try {
      setUploading(true)
      const fileName = `${user?.id}/${Date.now()}_${file.name}`
      
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload receipt')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { apiClient } = await import('../../utils/api')
      
      // Convert amount to company currency (assuming USD for demo)
      const companyCurrency = 'USD'
      const conversionData = await apiClient.convertCurrency(
        formData.currency,
        companyCurrency,
        parseFloat(formData.amount)
      )

      // Upload receipt if provided
      let receiptUrl = null
      if (formData.receiptFile) {
        receiptUrl = await handleFileUpload(formData.receiptFile)
      }

      // Create expense record
      const expenseData = {
        employee_id: user?.id,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        amount_in_company_currency: conversionData.convertedAmount,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        receipt_url: receiptUrl
      }

      const result = await apiClient.createExpense(expenseData)

      setSuccess(true)
      toast.success('Expense submitted successfully!')
      
      // Reset form
      setFormData({
        amount: '',
        currency: 'USD',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        receiptFile: null
      })
      
      // Navigate to dashboard after a delay
      setTimeout(() => {
        onNavigate('dashboard')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to submit expense')
      toast.error('Failed to submit expense')
    } finally {
      setLoading(false)
    }
  }

  const createApprovalSteps = async (expenseId: string) => {
    try {
      // For demo purposes, create a simple approval step to the user's manager
      // In a real app, this would follow complex approval rules
      if (user?.manager_id) {
        await supabase
          .from('approval_steps')
          .insert([
            {
              expense_id: expenseId,
              approver_id: user.manager_id,
              status: 'pending',
              sequence: 1
            }
          ])
      }
    } catch (error) {
      console.error('Error creating approval steps:', error)
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleOCRDataExtracted = (data: any) => {
    setFormData(prev => ({
      ...prev,
      amount: data.amount?.toString() || prev.amount,
      date: data.date || prev.date,
      description: data.description || prev.description,
      category: data.category ? categories.find(c => c.toLowerCase().includes(data.category.toLowerCase())) || prev.category : prev.category
    }))
    toast.success('Receipt data extracted successfully!')
  }

  const handleCurrencyConversion = (convertedAmount: number, fromCurrency: string, toCurrency: string, rate: number) => {
    toast.success(`Converted ${fromCurrency} to ${toCurrency} at rate ${rate.toFixed(4)}`)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center"
        >
          <Card className="p-8 shadow-xl">
            <CardContent className="space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-green-600">
                Expense Submitted!
              </h2>
              <p className="text-gray-600">
                Your expense has been submitted for approval and will be reviewed soon.
              </p>
              <Button onClick={() => onNavigate('dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Submit New Expense
          </h1>
          <p className="text-gray-600">
            Fill out the form below to submit your expense for approval
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Expense Details
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={formData.currency} 
                      onValueChange={(value) => handleInputChange('currency', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your expense..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Smart Features</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowOCR(true)}
                        disabled={loading}
                      >
                        <Scan className="h-4 w-4 mr-2" />
                        OCR Receipt
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCurrencyConverter(true)}
                        disabled={loading}
                      >
                        <Repeat className="h-4 w-4 mr-2" />
                        Currency
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Receipt (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleInputChange('receiptFile', e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={loading || uploading}
                    />
                    {formData.receiptFile ? (
                      <div className="space-y-2">
                        <FileText className="h-8 w-8 text-green-600 mx-auto" />
                        <p className="text-sm font-medium text-green-600">
                          {formData.receiptFile.name}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={triggerFileUpload}
                          disabled={loading || uploading}
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">
                          Click to upload receipt or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, PDF up to 10MB
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={triggerFileUpload}
                          disabled={loading || uploading}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Upload Receipt
                        </Button>
                      </div>
                    )}
                  </div>
                  {uploading && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <LoadingSpinner size="sm" />
                      <span>Uploading receipt...</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onNavigate('dashboard')}
                  disabled={loading || uploading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || uploading || !formData.category}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Submitting...</span>
                    </>
                  ) : (
                    'Submit Expense'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>

        {/* OCR Modal */}
        {showOCR && (
          <OCRReceiptUpload
            onDataExtracted={handleOCRDataExtracted}
            onClose={() => setShowOCR(false)}
          />
        )}

        {/* Currency Converter Modal */}
        {showCurrencyConverter && (
          <CurrencyConverter
            defaultFromCurrency={formData.currency}
            defaultToCurrency="USD"
            defaultAmount={parseFloat(formData.amount) || 100}
            onConvert={handleCurrencyConversion}
            standalone={true}
            onClose={() => setShowCurrencyConverter(false)}
          />
        )}
      </div>
    </div>
  )
}