import Link from 'next/link'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/card'
import { XCircle, Heart } from 'lucide-react'

export default function DonationCancelPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="h-20 w-20 text-orange-500" />
          </div>
          <CardTitle className="text-3xl">Donation Cancelled</CardTitle>
          <CardDescription className="text-lg">
            Your donation was not completed
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>

          <div className="text-muted-foreground space-y-4">
            <p>
              It looks like you cancelled the donation process. No charges have been made to your account.
            </p>

            <div className="bg-muted rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">Want to try again?</p>
              <p className="text-left">
                If you encountered any issues during the donation process, please let us know. We're here to help make your donation experience as smooth as possible.
              </p>
            </div>

            <p className="text-sm">
              Your support means the world to us. Even if you can't donate right now, sharing ChurchConnect with others helps tremendously.
            </p>

            <p className="text-sm">
              Questions? Contact us at support@churchconnect.jp
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/donate">Try Again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Thank you for considering supporting ChurchConnect Japan</p>
      </div>
    </div>
  )
}
