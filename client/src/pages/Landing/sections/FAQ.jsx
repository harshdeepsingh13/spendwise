import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography, useTheme } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { alpha } from '@mui/material/styles'
import { useScrollReveal } from '../hooks/useScrollReveal'

function FaqItem({ faq, index, expanded, setExpanded }) {
  const theme = useTheme()
  const [ref, visible] = useScrollReveal()
  return (
    <Box
      ref={ref}
      sx={{
        mb: 1.5,
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${index * 60}ms, transform 0.6s ease ${index * 60}ms`,
      }}
    >
      <Accordion
        expanded={expanded === index}
        onChange={(_, isExpanded) => setExpanded(isExpanded ? index : false)}
        disableGutters
        elevation={0}
        sx={{
          background: theme.palette.background.paper,
          border: `1px solid ${alpha('#94A3B8', expanded === index ? 0.18 : 0.06)}`,
          borderRadius: '14px !important',
          '&:before': { display: 'none' },
          transition: 'border-color 0.2s',
          '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.2) },
        }}
      >
        <AccordionSummary
          expandIcon={
            <AddIcon sx={{
              color: 'primary.light',
              transition: 'transform 0.3s',
              transform: expanded === index ? 'rotate(45deg)' : 'none',
            }} />
          }
          sx={{ px: 3, py: 0.5 }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{faq.q}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, pb: 2.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.75 }}>
            {faq.a}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

const FAQS = [
  {
    q: 'Is Spendwise really free to use?',
    a: 'Yes — expense tracking, OCR receipt scanning, analytics, and budget goals are completely free. No credit card required, no time limit.',
  },
  {
    q: 'How does OCR receipt scanning work?',
    a: 'Upload a photo of your receipt and our Tesseract-powered OCR reads the text and automatically extracts the total amount — usually in under 3 seconds.',
  },
  {
    q: 'Is my financial data secure?',
    a: 'Yes. All data is encrypted in transit (HTTPS) and at rest. Passwords are hashed with bcrypt. We support MFA via TOTP for extra account protection.',
  },
  {
    q: 'Can I sign up with Google?',
    a: 'Yes — one-click Google OAuth is fully supported. No password needed when signing in with Google.',
  },
  {
    q: 'What expense categories are supported?',
    a: 'You can create fully custom categories with your own names and colors, or use our defaults (Dining, Travel, Shopping, Utilities, and more).',
  },
  {
    q: "How does budget tracking work?",
    a: "Set a monthly spending limit per category. Spendwise tracks your spend in real time and alerts you when you're approaching your limit — so you can course-correct before going over.",
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default function FAQ() {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [headerRef, headerVisible] = useScrollReveal()

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <Box
        component="section"
        id="faq"
        sx={{ py: 11, px: { xs: 2, md: 6 }, maxWidth: 800, mx: 'auto', textAlign: 'center' }}
      >
        <Box ref={headerRef} sx={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'none' : 'translateY(30px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
          mb: 5,
        }}>
          <Typography variant="overline" sx={{ color: 'primary.light', display: 'block', mb: 1.5 }}>FAQ</Typography>
          <Typography variant="h2" sx={{ mb: 1.5 }}>SpendWise FAQ</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Everything you need to know about Spendwise.
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'left' }}>
          {FAQS.map((faq, i) => (
            <FaqItem key={faq.q} faq={faq} index={i} expanded={expanded} setExpanded={setExpanded} />
          ))}
        </Box>

      </Box>
    </>
  )
}
