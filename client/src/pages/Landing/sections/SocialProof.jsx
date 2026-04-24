import { Box, Divider, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";

function useCountUp(target, { duration = 2000, enabled = false, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(target * ease);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [enabled, target, duration]);
  return decimals ? value.toFixed(decimals) : Math.round(value);
}

const STATS = [
  { target: 2.4, decimals: 1, prefix: "$", suffix: "M", label: "~ expenses tracked" },
  { target: 100, decimals: 0, prefix: "", suffix: "+", label: "~ active users" },
  { target: 4.9, decimals: 1, prefix: "", suffix: "★", label: "average rating" },
  { target: 3, decimals: 0, prefix: "", suffix: " sec", label: "~ to scan a receipt" },
];

function StatItem({ stat, enabled, isLast }) {
  const theme = useTheme();
  const value = useCountUp(stat.target, { enabled, decimals: stat.decimals });

  return (
    <Box
      sx={{
        flex: { xs: "1 1 calc(50% - 12px)", md: "1 1 0" },
        maxWidth: 220,
        textAlign: "center",
        px: { xs: 1.5, md: 3.5 },
        position: "relative",
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: "1.6rem", md: "1.9rem" },
          fontWeight: 900,
          lineHeight: 1,
          background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {stat.prefix}
        {value}
        {stat.suffix}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.disabled", mt: 0.5, display: "block" }}>
        {stat.label}
      </Typography>
      {!isLast && (
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            display: { xs: "none", md: "block" },
            position: "absolute",
            right: 0,
            top: "10%",
            height: "80%",
            borderColor: alpha("#94A3B8", 0.08),
          }}
        />
      )}
    </Box>
  );
}

export default function SocialProof() {
  const theme = useTheme();
  const ref = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEnabled(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: { xs: 1.5, md: 0 },
        width: "100%",
        py: 3.5,
        px: { xs: 2, md: 6 },
        background: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: "blur(10px)",
        borderTop: `1px solid ${alpha("#94A3B8", 0.06)}`,
        borderBottom: `1px solid ${alpha("#94A3B8", 0.06)}`,
      }}
    >
      {STATS.map((stat, i) => (
        <StatItem key={stat.label} stat={stat} enabled={enabled} isLast={i === STATS.length - 1} />
      ))}
    </Box>
  );
}
