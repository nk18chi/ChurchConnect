'use client'

import { useState } from 'react'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label } from '@repo/ui'
import { HeartHandshake } from 'lucide-react'

const PRESET_AMOUNTS = [
  { value: 500, label: '¥500' },
  { value: 1000, label: '¥1,000' },
  { value: 3000, label: '¥3,000' },
  { value: 5000, label: '¥5,000' },
]

export default function DonatePage() {
  const [donationType, setDonationType] = useState<'ONE_TIME' | 'MONTHLY'>('ONE_TIME')
  const [amount, setAmount] = useState<number>(1000)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleAmountSelect = (value: number) => {
    setAmount(value)
    setIsCustom(false)
    setCustomAmount('')
    setError('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setIsCustom(true)
    const parsedAmount = parseInt(value)
    if (!isNaN(parsedAmount)) {
      setAmount(parsedAmount)
      if (parsedAmount < 100) {
        setError('Minimum donation amount is ¥100')
      } else {
        setError('')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (amount < 100) {
      setError('Minimum donation amount is ¥100')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Create Stripe Checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          type: donationType,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      console.error('Donation error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <HeartHandshake className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Support ChurchConnect</h1>
        <p className="text-lg text-muted-foreground">
          Your donation helps us maintain and grow this platform, making it easier for people across Japan to find and connect with churches.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Make a Donation</CardTitle>
            <CardDescription>
              All donations go towards platform maintenance and development. Minimum donation: ¥100
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Donation Type */}
            <div className="space-y-3">
              <Label>Donation Type</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="one-time"
                    value="ONE_TIME"
                    checked={donationType === 'ONE_TIME'}
                    onChange={(e) => setDonationType(e.target.value as 'ONE_TIME' | 'MONTHLY')}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="one-time" className="font-normal cursor-pointer">
                    One-time donation
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="monthly"
                    value="MONTHLY"
                    checked={donationType === 'MONTHLY'}
                    onChange={(e) => setDonationType(e.target.value as 'ONE_TIME' | 'MONTHLY')}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="monthly" className="font-normal cursor-pointer">
                    Monthly donation (recurring)
                  </Label>
                </div>
              </div>
            </div>

            {/* Amount Selection */}
            <div className="space-y-3">
              <Label>Select Amount</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={!isCustom && amount === preset.value ? 'default' : 'outline'}
                    onClick={() => handleAmountSelect(preset.value)}
                    className="h-16 text-lg"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-3">
              <Label htmlFor="custom-amount">Or enter a custom amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ¥
                </span>
                <Input
                  id="custom-amount"
                  type="number"
                  min="100"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-8"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {donationType === 'MONTHLY' ? 'Monthly donation:' : 'One-time donation:'}
                </span>
                <span className="text-2xl font-bold">¥{amount.toLocaleString()}</span>
              </div>
              {donationType === 'MONTHLY' && (
                <p className="text-xs text-muted-foreground mt-2">
                  You will be charged ¥{amount.toLocaleString()} every month. You can cancel anytime.
                </p>
              )}
            </div>

            {/* Information */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                • Payments are securely processed by Stripe
              </p>
              <p>
                • You will receive an email receipt after your donation
              </p>
              <p>
                • All amounts are in Japanese Yen (JPY)
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading || !!error || amount < 100}
            >
              {isLoading ? 'Processing...' : `Donate ¥${amount.toLocaleString()}`}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Thank You Section */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Thank you for supporting ChurchConnect Japan!</p>
        <p className="mt-2">
          Your generosity helps us serve the Christian community across Japan.
        </p>
      </div>
    </div>
  )
}
