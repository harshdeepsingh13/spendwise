import { Box, Grid, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Helmet } from 'react-helmet-async'
import { useScrollReveal } from '../hooks/useScrollReveal'

const TESTIMONIALS = [
  {
    stars: 5, initials: 'A', name: 'Alex M.', role: 'Freelance designer',
    avatarGradient: 'linear-gradient(135deg, #2563EB, #7C3AED)',
    text: '"I scanned 3 months of receipts in an afternoon. The OCR is scarily accurate. Finally know where my money actually goes."',
  },
  {
    stars: 5, initials: 'S', name: 'Sarah K.', role: 'Product manager',
    avatarGradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    text: '"The analytics changed how I budget. I cut dining spend by 30% in one month just by seeing the charts."',
  },
  {
    stars: 5, initials: 'J', name: 'James R.', role: 'Software engineer',
    avatarGradient: 'linear-gradient(135deg, #10B981, #059669)',
    text: '"Set up in 2 minutes. The Google login was seamless. Budget alerts stopped me from overspending twice this month."',
  },
]

const reviewsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: TESTIMONIALS.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Review',
      author: { '@type': 'Person', name: t.name },
      reviewRating: { '@type': 'Rating', ratingValue: String(t.stars), bestRating: '5' },
      reviewBody: t.text.replace(/^"|"$/g, ''),
      itemReviewed: { '@type': 'SoftwareApplication', name: 'Spendwise' },
    },
  })),
}

function TestimonialCard({ t, delay }) {
  const theme = useTheme()
  const [ref, visible] = useScrollReveal()
  return (
    <Box
      ref={ref}
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.background.paper}, #0F172A)`,
        border: `1px solid ${alpha('#94A3B8', 0.07)}`,
        borderRadius: 4, p: 3.5, height: '100%',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, border-color 0.3s`,
        '&:hover': { borderColor: alpha(theme.palette.secondary.main, 0.22) },
      }}
    >
      <Typography
        component="div"
        aria-label={`${t.stars} out of 5 stars`}
        sx={{ color: theme.palette.secondary.main, letterSpacing: 2, fontSize: 13, mb: 1.5 }}
      >
        {'★'.repeat(t.stars)}
      </Typography>
      <Typography
        component="blockquote"
        variant="body2"
        sx={{ color: 'text.secondary', lineHeight: 1.8, fontStyle: 'italic', m: 0, mb: 2 }}
      >
        {t.text}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '50%',
          background: t.avatarGradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'white',
        }}>
          {t.initials}
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{t.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>{t.role}</Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default function Testimonials() {
  const theme = useTheme()
  const [headerRef, headerVisible] = useScrollReveal()

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(reviewsJsonLd)}</script>
      </Helmet>
      <Box
        component="section"
        sx={{
          py: 11, px: { xs: 2, md: 6 },
          background: alpha(theme.palette.background.paper, 0.45),
          borderTop: `1px solid ${alpha('#94A3B8', 0.06)}`,
          borderBottom: `1px solid ${alpha('#94A3B8', 0.06)}`,
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <Box ref={headerRef} sx={{
            textAlign: 'center', mb: 6.5,
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'none' : 'translateY(30px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}>
            <Typography variant="overline" sx={{ color: 'primary.light', display: 'block', mb: 1.5 }}>
              Testimonials
            </Typography>
            <Typography variant="h2">What SpendWise Users Are Saying</Typography>
          </Box>
          <Grid container spacing={2.5}>
            {TESTIMONIALS.map((t, i) => (
              <Grid
                key={t.name}
                size={{
                  xs: 12,
                  md: 4
                }}>
                <TestimonialCard t={t} delay={i * 120} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </>
  );
}
