import { Box, Grid, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useScrollReveal } from "../hooks/useScrollReveal";

const STEPS = [
  {
    icon: "🔑",
    title: "1. Sign up free",
    desc: "Create your account with email or Google OAuth. No credit card needed. Done in 30 seconds.",
  },
  {
    icon: "💸",
    title: "2. Log expenses",
    desc: "Add expenses manually or scan receipts with your camera. OCR fills in the amount automatically.",
  },
  {
    icon: "📊",
    title: "3. See the picture",
    desc: "Your dashboard updates in real time. Spot trends, hit budget goals, and take control of your money.",
  },
];

function StepItem({ step, delay }) {
  const theme = useTheme();
  const [ref, visible] = useScrollReveal();
  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(40px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.elevated})`,
          border: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          mb: 2.5,
          position: "relative",
          zIndex: 1,
          transition: "border-color 0.3s, box-shadow 0.3s",
          "&:hover": {
            borderColor: theme.palette.primary.light,
            boxShadow: `0 0 28px ${alpha(theme.palette.primary.main, 0.3)}`,
          },
        }}
      >
        {step.icon}
      </Box>
      <Typography variant="h3" component="h3" sx={{ mb: 1, fontSize: '1.1rem', fontWeight: 600 }}>
        {step.title}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7, maxWidth: 240, mx: "auto" }}>
        {step.desc}
      </Typography>
    </Box>
  );
}

export default function HowItWorks() {
  const theme = useTheme();
  const [headerRef, headerVisible] = useScrollReveal();

  return (
    <Box
      component="section"
      id="how"
      sx={{
        py: 11,
        px: { xs: 2, md: 6 },
        maxWidth: 1100,
        mx: "auto",
        textAlign: "center",
        background: `linear-gradient(180deg, transparent, ${alpha(theme.palette.primary.main, 0.025)}, transparent)`,
      }}
    >
      <Box
        ref={headerRef}
        sx={{
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? "none" : "translateY(30px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
          mb: 7,
        }}
      >
        <Typography variant="overline" sx={{ color: "primary.light", display: "block", mb: 1.5 }}>
          How it works
        </Typography>
        <Typography variant="h2" sx={{ mb: 1.5 }}>
          How SpendWise & Receipt Scanner Works
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 440, mx: "auto" }}>
          No setup, no complex onboarding. Sign up and start tracking immediately.
        </Typography>
      </Box>

      <Box sx={{ position: "relative" }}>
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            top: 32,
            left: "16%",
            right: "16%",
            height: "3px",
            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.4)}, ${alpha(theme.palette.secondary.main, 0.25)}, ${alpha(theme.palette.success.main, 0.4)})`,
          }}
        />
        <Grid container spacing={3}>
          {STEPS.map((step, i) => (
            <Grid item xs={12} md={4} key={step.title}>
              <StepItem step={step} delay={i * 120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
