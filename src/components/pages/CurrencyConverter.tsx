import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { ArrowRightLeft, DollarSign, TrendingUp, Globe } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface Currency {
  code: string
  name: string
  symbol: string
}

interface ExchangeRate {
  from: string
  to: string
  rate: number
  lastUpdated: string
}

interface CurrencyApiResponse {
  base: string
  rates: Record<string, number>
  date: string
}

const POPULAR_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' }
]

export const CurrencyConverter: React.FC<{
  defaultFromCurrency?: string
  defaultToCurrency?: string
  defaultAmount?: number
  onConvert?: (convertedAmount: number, fromCurrency: string, toCurrency: string, rate: number) => void
  standalone?: boolean
  onClose?: () => void
}> = ({ 
  defaultFromCurrency = 'USD', 
  defaultToCurrency = 'EUR',
  defaultAmount = 100,
  onConvert,
  standalone = false,
  onClose 
}) => {
  const [amount, setAmount] = useState(defaultAmount)
  const [fromCurrency, setFromCurrency] = useState(defaultFromCurrency)
  const [toCurrency, setToCurrency] = useState(defaultToCurrency)
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [allCurrencies, setAllCurrencies] = useState<Currency[]>(POPULAR_CURRENCIES)

  useEffect(() => {
    loadAllCurrencies()
  }, [])

  useEffect(() => {
    if (amount && fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      convertCurrency()
    }
  }, [amount, fromCurrency, toCurrency])

  const loadAllCurrencies = async () => {
    try {
      // In a real implementation, you would fetch from a currencies API
      // For demo purposes, we'll use the popular currencies list
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies')
      const countries = await response.json()
      
      const currencySet = new Set<string>()
      const extractedCurrencies: Currency[] = []
      
      countries.forEach((country: any) => {
        if (country.currencies) {
          Object.entries(country.currencies).forEach(([code, details]: [string, any]) => {
            if (!currencySet.has(code)) {
              currencySet.add(code)
              extractedCurrencies.push({
                code,
                name: details.name,
                symbol: details.symbol || code
              })
            }
          })
        }
      })
      
      // Merge with popular currencies, prioritizing popular ones
      const mergedCurrencies = [
        ...POPULAR_CURRENCIES,
        ...extractedCurrencies.filter(curr => 
          !POPULAR_CURRENCIES.some(pop => pop.code === curr.code)
        )
      ].sort((a, b) => a.code.localeCompare(b.code))
      
      setAllCurrencies(mergedCurrencies)
    } catch (error) {
      console.error('Error loading currencies:', error)
      // Fall back to popular currencies
      setAllCurrencies(POPULAR_CURRENCIES)
    }
  }

  const convertCurrency = async () => {
    if (!amount || fromCurrency === toCurrency) {
      setConvertedAmount(amount)
      setExchangeRate(1)
      return
    }

    setLoading(true)
    try {
      // In production, use a real currency API
      // For demo, we'll simulate conversion rates
      const simulatedRates: Record<string, Record<string, number>> = {
        'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110, 'CAD': 1.25, 'AUD': 1.35 },
        'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 129, 'CAD': 1.47, 'AUD': 1.59 },
        'GBP': { 'USD': 1.37, 'EUR': 1.16, 'JPY': 150, 'CAD': 1.71, 'AUD': 1.85 }
      }

      let rate = 1
      if (simulatedRates[fromCurrency]?.[toCurrency]) {
        rate = simulatedRates[fromCurrency][toCurrency]
      } else if (simulatedRates[toCurrency]?.[fromCurrency]) {
        rate = 1 / simulatedRates[toCurrency][fromCurrency]
      } else {
        // Fallback to random rate for demo
        rate = 0.5 + Math.random() * 2
      }

      const converted = amount * rate
      setConvertedAmount(converted)
      setExchangeRate(rate)
      setLastUpdated(new Date().toLocaleString())

      if (onConvert) {
        onConvert(converted, fromCurrency, toCurrency, rate)
      }

      toast.success('Currency converted successfully')
    } catch (error) {
      console.error('Currency conversion error:', error)
      toast.error('Failed to convert currency')
    } finally {
      setLoading(false)
    }
  }

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const formatCurrency = (amount: number, currency: string) => {
    const currencyData = allCurrencies.find(c => c.code === currency)
    const symbol = currencyData?.symbol || currency
    return `${symbol}${amount.toFixed(2)}`
  }

  const content = (
    <Card className={standalone ? 'border-0' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Currency Converter
            </CardTitle>
            <CardDescription>
              Convert amounts between different currencies with real-time rates
            </CardDescription>
          </div>
          {standalone && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter amount"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fromCurrency">From</Label>
            <div className="flex gap-2">
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCurrencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{currency.code}</span>
                        <span className="text-sm text-gray-600">{currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={swapCurrencies}
                className="shrink-0"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toCurrency">To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allCurrencies.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{currency.code}</span>
                      <span className="text-sm text-gray-600">{currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {convertedAmount !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border"
          >
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                <span>{formatCurrency(amount, fromCurrency)}</span>
                <ArrowRightLeft className="h-5 w-5 text-gray-400" />
                <span className="text-blue-600">
                  {formatCurrency(convertedAmount, toCurrency)}
                </span>
              </div>
              
              {exchangeRate && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                  </span>
                </div>
              )}
              
              {lastUpdated && (
                <Badge variant="outline" className="text-xs">
                  Updated: {lastUpdated}
                </Badge>
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {POPULAR_CURRENCIES.slice(0, 4).map(currency => (
            <Button
              key={currency.code}
              variant="outline"
              size="sm"
              onClick={() => setToCurrency(currency.code)}
              className="text-xs"
            >
              {currency.symbol} {currency.code}
            </Button>
          ))}
        </div>

        <Button 
          onClick={convertCurrency} 
          disabled={loading || !amount}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Converting...
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              Convert Currency
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )

  if (standalone) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {content}
        </motion.div>
      </div>
    )
  }

  return content
}