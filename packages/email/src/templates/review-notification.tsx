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

interface ReviewNotificationEmailProps {
  churchName: string
  reviewerName: string
  rating: number
  reviewContent: string
  reviewDate: string
  reviewUrl: string
}

export function ReviewNotificationEmail({
  churchName,
  reviewerName,
  rating,
  reviewContent,
  reviewDate,
  reviewUrl,
}: ReviewNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New review for {churchName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Review Approved</Heading>

          <Text style={text}>
            A new review has been approved and published for {churchName}.
          </Text>

          <Section style={reviewBox}>
            <Text style={reviewerText}>
              {reviewerName} • {rating} stars • {reviewDate}
            </Text>
            <Text style={reviewText}>{reviewContent}</Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={reviewUrl}>
              View Review & Respond
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You can respond to this review in your church portal.
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
}

const reviewBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 40px',
}

const reviewerText = {
  fontSize: '14px',
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
