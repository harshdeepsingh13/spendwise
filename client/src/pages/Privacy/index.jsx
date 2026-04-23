import { Container, Typography, Link } from '@mui/material'
import { Helmet } from 'react-helmet-async'
import { Link as RouterLink } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — Spendwise</title>
        <meta name="description" content="Spendwise Privacy Policy: how we collect, use, and protect your financial data." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 800, mb: 1 }}>
          Privacy Policy
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled', mb: 4 }}>
          Last updated: May 2026
        </Typography>

        <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 }}>
          Data We Collect
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          We collect the email address and name you provide on signup, your expense records, receipt images, and usage analytics. OAuth users (Google, GitHub) share only their name and email with us — we never receive OAuth passwords.
        </Typography>

        <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 }}>
          How We Use Your Data
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          Your data is used solely to provide the Spendwise service: displaying your expenses, running analytics, and scanning receipts. We do not sell, rent, or share your personal data with third parties for marketing.
        </Typography>

        <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 }}>
          Data Security
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          All data is encrypted in transit via HTTPS (TLS 1.2+) and at rest. Passwords are hashed with bcrypt (cost factor 10). Multi-factor authentication (TOTP) is available to all users. Receipt images are stored on Cloudinary with access-controlled URLs.
        </Typography>

        <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 }}>
          Your Rights
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          You may request deletion of your account and all associated data at any time. To exercise this right, contact us at the address below.
        </Typography>

        <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 }}>
          Cookies
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          Spendwise uses a single JWT stored in localStorage for authentication. We do not use third-party advertising cookies or tracking pixels.
        </Typography>

        <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 }}>
          Contact
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          Questions? Reach us via the GitHub repository linked in the footer.
        </Typography>

        <Link component={RouterLink} to="/" sx={{ color: 'primary.main' }}>
          ← Back to Spendwise
        </Link>
      </Container>
    </>
  )
}
