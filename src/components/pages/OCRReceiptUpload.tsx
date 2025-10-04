import React, { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Upload, Camera, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface ExtractedData {
  amount?: number
  date?: string
  vendor?: string
  category?: string
  description?: string
  confidence?: number
}

interface OCRResult {
  success: boolean
  data?: ExtractedData
  rawText?: string
  error?: string
}

export const OCRReceiptUpload: React.FC<{
  onDataExtracted: (data: ExtractedData) => void
  onClose: () => void
}> = ({ onDataExtracted, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Process with OCR
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('receipt', file)

      const response = await fetch(`https://${await import('../../utils/supabase/info').then(m => m.projectId)}.supabase.co/functions/v1/make-server-c4c7235f/ocr/process-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await import('../../utils/supabase/info').then(m => m.publicAnonKey)}`
        },
        body: formData
      })

      const result: OCRResult = await response.json()
      setOcrResult(result)

      if (result.success && result.data) {
        setExtractedData(result.data)
        toast.success('Receipt processed successfully!')
      } else {
        toast.error(result.error || 'Failed to process receipt')
      }
    } catch (error) {
      console.error('OCR processing error:', error)
      toast.error('Failed to process receipt')
      setOcrResult({ success: false, error: 'Network error' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleUseExtractedData = () => {
    if (extractedData) {
      onDataExtracted(extractedData)
      onClose()
    }
  }

  const simulateOCR = (file: File) => {
    // Simulate OCR processing for demo purposes
    setTimeout(() => {
      const mockData: ExtractedData = {
        amount: Math.round((Math.random() * 200 + 10) * 100) / 100,
        date: new Date().toISOString().split('T')[0],
        vendor: ['Starbucks', 'Uber Eats', 'Office Depot', 'Amazon', 'Target'][Math.floor(Math.random() * 5)],
        category: ['food', 'transportation', 'office_supplies', 'software', 'travel'][Math.floor(Math.random() * 5)],
        description: 'Receipt automatically processed via OCR',
        confidence: Math.round((Math.random() * 20 + 80) * 100) / 100
      }
      
      setExtractedData(mockData)
      setOcrResult({ success: true, data: mockData })
      setIsProcessing(false)
      toast.success('Receipt processed successfully! (Demo mode)')
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  OCR Receipt Processing
                </CardTitle>
                <CardDescription>
                  Upload a receipt image to automatically extract expense details
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!previewUrl ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Upload Receipt Image</p>
                    <p className="text-gray-600">
                      Drag & drop your receipt here, or click to browse
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Supports JPG, PNG, HEIC formats
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Receipt Preview
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewUrl(null)
                      setExtractedData(null)
                      setOcrResult(null)
                    }}
                  >
                    Upload Different Image
                  </Button>
                </div>
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="w-full max-h-64 object-contain border rounded-lg"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="bg-white p-4 rounded-lg text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Processing receipt...</p>
                      </div>
                    </div>
                  )}
                </div>

                {!isProcessing && !ocrResult && (
                  <Button
                    onClick={() => {
                      setIsProcessing(true)
                      // For demo purposes, simulate OCR
                      simulateOCR(new File([], 'receipt.jpg'))
                    }}
                    className="w-full"
                  >
                    Process with OCR
                  </Button>
                )}

                {ocrResult && (
                  <div className="space-y-4">
                    <Separator />
                    <div className="flex items-center gap-2">
                      {ocrResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <h3 className="font-medium">
                        {ocrResult.success ? 'Extraction Complete' : 'Processing Failed'}
                      </h3>
                    </div>

                    {ocrResult.success && extractedData && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-gray-600">Amount</Label>
                            <p className="font-medium">
                              ${extractedData.amount?.toFixed(2) || 'Not detected'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Date</Label>
                            <p className="font-medium">
                              {extractedData.date || 'Not detected'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Vendor</Label>
                            <p className="font-medium">
                              {extractedData.vendor || 'Not detected'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-600">Category</Label>
                            <p className="font-medium capitalize">
                              {extractedData.category?.replace('_', ' ') || 'Not detected'}
                            </p>
                          </div>
                        </div>
                        
                        {extractedData.confidence && (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-gray-600">Confidence:</Label>
                            <Badge 
                              variant={extractedData.confidence > 90 ? 'default' : 
                                      extractedData.confidence > 70 ? 'secondary' : 'outline'}
                            >
                              {extractedData.confidence.toFixed(1)}%
                            </Badge>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleUseExtractedData} className="flex-1">
                            Use This Data
                          </Button>
                          <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {!ocrResult.success && (
                      <div className="text-red-600 text-sm">
                        {ocrResult.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}