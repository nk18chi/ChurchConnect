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

interface ContactFormEmailProps {
  name: string
  email: string
  subject: string
  message: string
  churchName?: string
}

export function ContactFormEmail({
  name,
  email,
  subject,
  message,
  churchName,
}: ContactFormEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New contact form submission from {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {churchName ? `Contact Form - ${churchName}` : 'Contact Form Submission'}
          </Heading>

          <Section style={section}>
            <Text style={label}>From:</Text>
            <Text style={value}>{name} ({email})</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Subject:</Text>
            <Text style={value}>{subject}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Message:</Text>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This message was sent via ChurchConnect Japan contact form.
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

const section = {
  padding: '0 40px',
  marginBottom: '20px',
}

const label = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666',
  margin: '0 0 4px',
}

const value = {
  fontSize: '16px',
  color: '#333',
  margin: '0',
}

const messageText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333',
  whiteSpace: 'pre-wrap' as const,
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
