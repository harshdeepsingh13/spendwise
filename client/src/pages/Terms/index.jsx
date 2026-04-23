import { Container, Typography, Link } from '@mui/material'
import { Helmet } from 'react-helmet-async'
import { Link as RouterLink } from 'react-router-dom'

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service — Spendwise</title>
        <meta name="description" content="Spendwise Terms of Service: your rights and responsibilities when using the app." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 800, mb: 1 }}>
          Terms of Service
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled', mb: 4 }}>
          Last updated: May 2026
        </Typography>

        <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 }}>
          Use of Service
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          Spendwise is a personal finance tracking tool provided free of charge. You may use it for personal, non-commercial expense tracking. You may not use it for illegal purposes or attempt to reverse-engineer, disrupt, or exploit the service.
        </Typography>

        <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 }}>
          Your Content
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          You retain ownership of all data you input into Spendwise (expenses, categories, receipts). By using the service, you grant us a limited licence to store and process that data to provide the service.
        </Typography>

        <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 }}>
          Availability
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          We aim to keep Spendwise available but cannot guarantee uninterrupted access. The service is provided "as is" without warranties of any kind.
        </Typography>

        <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 }}>
          Account Termination
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          You may delete your account at any time. We reserve the right to suspend accounts that violate these terms.
        </Typography>

        <Typography variant="h2" sx={{ fontSize: '1.2rem', fontWeight: 700, mt: 4, mb: 1 }}>
          Changes to Terms
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          We may update these terms at any time. Continued use of Spendwise after changes constitutes acceptance of the updated terms.
        </Typography>

        <Link component={RouterLink} to="/" sx={{ color: 'primary.main' }}>
          ← Back to Spendwise
        </Link>
      </Container>
    </>
  )
}
