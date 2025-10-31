import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface DonationReceiptEmailProps {
  donorName: string
  amount: number
  currency: string
  type: 'ONE_TIME' | 'MONTHLY'
  date: string
  receiptNumber: string
  paymentMethod?: string
}

export function DonationReceiptEmail({
  donorName,
  amount,
  currency,
  type,
  date,
  receiptNumber,
  paymentMethod,
}: DonationReceiptEmailProps) {
  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
  }).format(amount / 100) // Stripe amounts are in cents

  return (
    <Html>
      <Head />
      <Preview>Thank you for your donation to ChurchConnect Japan</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thank You for Your Donation!</Heading>

          <Text style={text}>
            Dear {donorName},
          </Text>

          <Text style={text}>
            Thank you for supporting ChurchConnect Japan. Your generous donation helps us connect Christians with churches across Japan.
          </Text>

          <Section style={receiptBox}>
            <Heading style={h2}>Donation Receipt</Heading>
            <Text style={receiptLine}>
              <strong>Receipt Number:</strong> {receiptNumber}
            </Text>
            <Text style={receiptLine}>
              <strong>Date:</strong> {date}
            </Text>
            <Text style={receiptLine}>
              <strong>Amount:</strong> {formattedAmount}
            </Text>
            <Text style={receiptLine}>
              <strong>Type:</strong> {type === 'ONE_TIME' ? 'One-time Donation' : 'Monthly Subscription'}
            </Text>
            {paymentMethod && (
              <Text style={receiptLine}>
                <strong>Payment Method:</strong> {paymentMethod}
              </Text>
            )}
          </Section>

          {type === 'MONTHLY' && (
            <Text style={text}>
              You will be charged {formattedAmount} monthly. You can manage your subscription anytime in your account settings.
            </Text>
          )}

          <Section style={footer}>
            <Text style={footerText}>
              This is your official donation receipt. Please keep it for your records.
            </Text>
            <Text style={footerText}>
              ChurchConnect Japan is a non-profit platform supporting churches across Japan.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333',
  padding: '0 40px',
  marginBottom: '16px',
}

const receiptBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 40px',
}

const receiptLine = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#333',
  margin: '8px 0',
}

const footer = {
  padding: '0 40px',
  marginTop: '40px',
  borderTop: '1px solid #eee',
  paddingTop: '20px',
}

const footerText = {
  fontSize: '12px',
  color: '#999',
  marginBottom: '8px',
}
