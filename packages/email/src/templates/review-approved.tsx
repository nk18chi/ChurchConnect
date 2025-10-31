import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ReviewApprovedEmailProps {
  reviewerName: string
  churchName: string
  reviewContent: string
  reviewUrl: string
}

export function ReviewApprovedEmail({
  reviewerName,
  churchName,
  reviewContent,
  reviewUrl,
}: ReviewApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your review for {churchName} has been approved</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Review Approved</Heading>

          <Text style={text}>
            Hi {reviewerName},
          </Text>

          <Text style={text}>
            Great news! Your review for {churchName} has been approved and is now live on ChurchConnect Japan.
          </Text>

          <Section style={reviewBox}>
            <Text style={reviewLabel}>Your Review:</Text>
            <Text style={reviewText}>{reviewContent}</Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={reviewUrl}>
              View Your Review
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Thank you for contributing to the ChurchConnect Japan community!
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

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333',
  padding: '0 40px',
  marginBottom: '20px',
}

const reviewBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 40px',
}

const reviewLabel = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666',
  marginBottom: '8px',
}

const reviewText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333',
  margin: '0',
}

const buttonSection = {
  padding: '0 40px',
  marginTop: '20px',
}

const button = {
  backgroundColor: '#ed1c24',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
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
}
