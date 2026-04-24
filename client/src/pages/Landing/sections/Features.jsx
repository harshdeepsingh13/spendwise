import { Box, Grid, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useScrollReveal } from '../hooks/useScrollReveal'

const FEATURES = [
  {
    icon: '💳', title: 'Expense Tracking',
    desc: 'Log expenses instantly with custom categories, tags, and dates. Filter, sort, and search your entire history in seconds.',
    tag: 'Core', tagColor: 'primary',
  },
  {
    icon: '📸', title: 'OCR Receipt Scanning',
    desc: 'Snap a photo of any receipt — Tesseract OCR extracts the amount automatically. No manual typing, ever.',
    tag: 'AI-powered', tagColor: 'secondary',
  },
  {
    icon: '📈', title: 'Smart Analytics',
    desc: 'Monthly trends, category breakdowns, year-over-year comparisons, and live KPI dashboards — all in real time.',
    tag: 'Insights', tagColor: 'success',
  },
  {
    icon: '🎯', title: 'Budget Goals',
    desc: 'Set monthly budgets per category. Visual progress rings alert you before you overspend — not after.',
    tag: 'Goals', tagColor: 'info',
  },
]

function FeatureCard({ feature, delay }) {
  const theme = useTheme()
  const [ref, visible] = useScrollReveal()
  const colorMap = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    info: theme.palette.info.main,
  }
  const color = colorMap[feature.tagColor]

  return (
    <Box
      ref={ref}
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.background.paper}, #0F172A)`,
        border: `1px solid ${alpha('#94A3B8', 0.1)}`,
        borderRadius: 4,
        p: 3.5,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, border-color 0.3s, box-shadow 0.3s`,
        '&::before': {
          content: '""',
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${alpha(color, 0.4)}, transparent)`,
        },
        '&:hover': {
          borderColor: alpha(color, 0.35),
          transform: 'translateY(-4px)',
          boxShadow: `0 20px 60px ${alpha(color, 0.1)}`,
        },
      }}
    >
      <Box sx={{
        width: 48, height: 48, borderRadius: 3,
        background: alpha(color, 0.12),
        border: `1px solid ${alpha(color, 0.2)}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, mb: 2,
      }}>
        {feature.icon}
      </Box>
      <Typography variant="h3" component="h3" sx={{ mb: 1, color: 'text.primary', fontSize: '1.1rem', fontWeight: 600 }}>{feature.title}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.75 }}>{feature.desc}</Typography>
      <Box sx={{
        display: 'inline-block', mt: 2, px: 1.5, py: 0.4,
        borderRadius: 3, background: alpha(color, 0.12),
        fontSize: 11, fontWeight: 600, color,
      }}>
        {feature.tag}
      </Box>
    </Box>
  )
}

export default function Features() {
  const [headerRef, headerVisible] = useScrollReveal()

  return (
    <Box
      component="section"
      id="features"
      sx={{
        py: 11,
        px: { xs: 2, md: 6 },
        maxWidth: 1100,
        mx: 'auto',
      }}
    >
      <Box ref={headerRef} sx={{
        opacity: headerVisible ? 1 : 0,
        transform: headerVisible ? 'none' : 'translateY(30px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        mb: 6.5,
      }}>
        <Typography variant="overline" sx={{ color: 'primary.light', display: 'block', mb: 1.5 }}>
          Features
        </Typography>
        <Typography variant="h2" sx={{ mb: 1.5 }}>Expense Tracking, OCR Receipts & Budget Tools</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 480 }}>
          Built for people who want clarity over their spending without the spreadsheet headache.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {FEATURES.map((feature, i) => (
          <Grid item xs={12} sm={6} key={feature.title}>
            <FeatureCard feature={feature} delay={i * 100} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
