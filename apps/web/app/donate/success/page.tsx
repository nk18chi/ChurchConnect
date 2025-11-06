import Link from 'next/link'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui'
import { CheckCircle2, Heart } from 'lucide-react'

export default function DonationSuccessPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
          </div>
          <CardTitle className="text-3xl">Thank You!</CardTitle>
          <CardDescription className="text-lg">
            Your donation has been successfully processed
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Heart className="h-12 w-12 text-primary fill-primary" />
          </div>

          <div className="text-muted-foreground space-y-4">
            <p>
              We are incredibly grateful for your generosity. Your support helps us maintain and improve ChurchConnect Japan, making it easier for people across the country to find and connect with churches.
            </p>

            <div className="bg-muted rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">What happens next?</p>
              <ul className="text-left space-y-2">
                <li>• You will receive a receipt via email shortly</li>
                <li>• Your donation will be processed by Stripe</li>
                <li>• You can view your donation history in your account</li>
                <li>• For monthly donations, you can manage or cancel your subscription anytime</li>
              </ul>
            </div>

            <p className="text-sm">
              If you have any questions about your donation, please contact us at support@churchconnect.jp
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/churches">Browse Churches</Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Thank you for being part of our community!</p>
      </div>
    </div>
  )
}
