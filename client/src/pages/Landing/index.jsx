import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Box, Divider, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import LandingNav from './components/LandingNav'
import AuthModal from './components/AuthModal'
import Hero from './sections/Hero'
import SocialProof from './sections/SocialProof'
import Features from './sections/Features'
import HowItWorks from './sections/HowItWorks'
import Testimonials from './sections/Testimonials'
import FAQ from './sections/FAQ'
import FinalCTA from './sections/FinalCTA'

const softwareAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Spendwise',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description: 'Track expenses, scan receipts with AI-powered OCR, and visualize your spending. Free forever.',
  url: 'https://spendwise.app',
  datePublished: '2025-01-01',
  dateModified: '2026-05-01',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '1200' },
  author: { '@type': 'Person', name: 'Harshdeep Singh', url: 'https://theharshdeepsingh.com' },
}

const authorJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Harshdeep Singh',
  url: 'https://theharshdeepsingh.com',
  sameAs: [
    'https://github.com/harshdeepsingh13',
  ],
}

const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Spendwise',
  url: 'https://spendwise.app',
  description: 'Free expense tracker with AI-powered OCR receipt scanning and budget analytics.',
}

export default function LandingPage() {
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('signup')

  useEffect(() => {
    const auth = searchParams.get('auth')
    if (auth === 'login' || auth === 'signup') {
      setAuthTab(auth)
      setAuthOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const openAuth = (tab = 'signup') => {
    setAuthTab(tab)
    setAuthOpen(true)
  }

  const divider = (
    <Divider sx={{
      borderColor: 'transparent',
      backgroundImage: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.22)}, ${alpha(theme.palette.secondary.main, 0.12)}, transparent)`,
      height: 1,
      border: 'none',
    }} />
  )

  return (
    <>
      <Helmet>
        <title>SpendWise — Smart Budget App</title>
        <meta name="description" content="Track expenses, scan receipts with AI-powered OCR, and visualize your spending trends. Free forever. No credit card required." />
        <link rel="canonical" href="https://spendwise.app/" />
        <meta property="og:title" content="SpendWise — Smart Budget App" />
        <meta property="og:description" content="Track expenses, scan receipts with AI-powered OCR, and visualize your spending. Free forever." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spendwise.app/" />
        <meta property="og:image" content="https://spendwise.app/og-image.svg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/svg+xml" />
        <meta property="og:image:alt" content="SpendWise dashboard preview" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SpendWise — Smart Budget App" />
        <meta name="twitter:description" content="Track expenses, scan receipts, hit your budget goals. Free forever." />
        <meta name="twitter:image" content="https://spendwise.app/og-image.svg" />
        <meta name="twitter:image:alt" content="SpendWise dashboard preview" />
        <meta name="twitter:creator" content="@harshdeepsingh" />
        <script type="application/ld+json">{JSON.stringify(softwareAppJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(authorJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(webSiteJsonLd)}</script>
      </Helmet>

      <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', overflowX: 'hidden' }}>
        <LandingNav onOpenAuth={openAuth} />
        <Hero onOpenAuth={openAuth} />
        {divider}
        <SocialProof />
        {divider}
        <Features />
        {divider}
        <HowItWorks />
        {divider}
        <Testimonials />
        {divider}
        <FAQ />
        {divider}
        <FinalCTA onOpenAuth={openAuth} />
      </Box>

      <AuthModal
        open={authOpen}
        defaultTab={authTab}
        onClose={() => setAuthOpen(false)}
      />
    </>
  )
}
