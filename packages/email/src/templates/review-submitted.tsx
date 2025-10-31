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

interface ReviewSubmittedEmailProps {
  reviewerName: string
  churchName: string
  reviewContent: string
}

export function ReviewSubmittedEmail({
  reviewerName,
  churchName,
  reviewContent,
}: ReviewSubmittedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your review for {churchName} has been submitted</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Review Submitted</Heading>

          <Text style={text}>
            Hi {reviewerName},
          </Text>

          <Text style={text}>
            Thank you for submitting a review for {churchName}. Your review is currently awaiting moderation and will be published once approved by our team.
          </Text>

          <Section style={reviewBox}>
            <Text style={reviewLabel}>Your Review:</Text>
            <Text style={reviewText}>{reviewContent}</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              We review all submissions to ensure they meet our community guidelines. You'll receive an email notification once your review is approved.
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
