/**
 * Spendwise — MUI v5 Theme Configuration
 * Palette: Royal Blue primary · Gold wisdom accent · Deep navy surfaces
 *
 * Usage:
 *   import { theme } from './spendwise-theme';
 *   <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>
 *
 * Install DM Sans (recommended):
 *   npm install @fontsource/dm-sans
 *   import '@fontsource/dm-sans/400.css';
 *   import '@fontsource/dm-sans/500.css';
 *   import '@fontsource/dm-sans/700.css';
 */

import { alpha, createTheme } from "@mui/material/styles";

// ── Brand tokens ─────────────────────────────────────────────────────────────
const BLUE = {
  main: "#2563EB",
  light: "#3B82F6",
  dark: "#1D4ED8",
  deeper: "#1E3A8A",
  contrastText: "#FFFFFF",
};

const GOLD = {
  main: "#F59E0B",
  light: "#FCD34D",
  dark: "#D97706",
  contrastText: "#1C1409",
};

const BG = {
  default: "#0C1220", // deepest navy — app shell
  paper: "#111827", // card / surface
  elevated: "#162036", // modal / drawer / popover
  overlay: "#1E2D45", // overlay surfaces
};

const TEXT = {
  primary: "#F1F5F9",
  secondary: "#94A3B8",
  disabled: "#475569",
};

// ── Theme ─────────────────────────────────────────────────────────────────────
export const theme = createTheme({
  // ── Palette ────────────────────────────────────────────────────────────────
  palette: {
    mode: "dark",
    primary: BLUE,
    secondary: GOLD,
    background: BG,
    text: TEXT,

    success: { main: "#10B981", light: "#34D399", dark: "#059669", contrastText: "#fff" },
    warning: { main: "#F59E0B", light: "#FCD34D", dark: "#D97706", contrastText: "#1C1409" },
    error: { main: "#EF4444", light: "#FCA5A5", dark: "#DC2626", contrastText: "#fff" },
    info: { main: "#38BDF8", light: "#7DD3FC", dark: "#0284C7", contrastText: "#fff" },

    divider: alpha("#94A3B8", 0.1),

    // Custom Spendwise semantic tokens
    custom: {
      goldText: GOLD.main,
      navyDeep: BLUE.deeper,
      receiptSurf: "#162036",
      aiPurple: "#7C3AED",
      scanLine: alpha(BLUE.main, 0.12),
      amountGold: GOLD.main,
      spendRed: "#F87171",
      incomeGreen: "#34D399",
      hexBadge: BLUE.deeper,
    },
  },

  // ── Typography ─────────────────────────────────────────────────────────────
  typography: {
    fontFamily: '"DM Sans", "Inter", system-ui, -apple-system, sans-serif',
    h1: { fontSize: "2.75rem", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.12 },
    h2: { fontSize: "2.125rem", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.18 },
    h3: { fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.26 },
    h4: { fontSize: "1.4rem", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.32 },
    h5: { fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.005em", lineHeight: 1.4 },
    h6: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: "1rem", lineHeight: 1.7, letterSpacing: "0.008em" },
    body2: { fontSize: "0.875rem", lineHeight: 1.65, letterSpacing: "0.008em" },
    caption: { fontSize: "0.75rem", lineHeight: 1.5, color: TEXT.secondary },
    overline: { fontSize: "0.68rem", letterSpacing: "0.14em", fontWeight: 600, textTransform: "uppercase" },
    button: { fontWeight: 600, letterSpacing: "0.015em", textTransform: "none" },
    // Utility: large amount display (e.g. "$2,489.50")
    // Use variant="h2" with sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}
  },

  // ── Shape ──────────────────────────────────────────────────────────────────
  shape: { borderRadius: 12 },

  // ── Shadows (cool-tinted, financial) ───────────────────────────────────────
  shadows: [
    "none",
    `0 1px 3px ${alpha("#000", 0.3)}`,
    `0 2px 6px ${alpha("#000", 0.32)}`,
    `0 4px 10px ${alpha("#000", 0.34)}`,
    `0 6px 16px ${alpha("#000", 0.36)}`,
    `0 8px 22px ${alpha("#000", 0.38)}`,
    `0 10px 28px ${alpha("#000", 0.4)}`,
    `0 12px 36px ${alpha("#000", 0.42)}`,
    // index 8: blue glow (primary buttons, focused inputs)
    `0 4px 18px ${alpha(BLUE.main, 0.3)}`,
    // index 9: blue glow lg
    `0 8px 32px ${alpha(BLUE.main, 0.35)}`,
    // index 10: gold glow (secondary / amount highlights)
    `0 4px 18px ${alpha(GOLD.main, 0.28)}`,
    // index 11: gold glow lg
    `0 8px 32px ${alpha(GOLD.main, 0.35)}`,
    ...Array(13).fill(`0 20px 60px ${alpha("#000", 0.5)}`),
  ],

  // ── Component overrides ────────────────────────────────────────────────────
  components: {
    // Global baseline
    MuiCssBaseline: {
      styleOverrides: {
        "*, *::before, *::after": { boxSizing: "border-box" },
        body: {
          backgroundColor: BG.default,
          backgroundImage: `
            radial-gradient(ellipse 90% 55% at 15% -5%,  ${alpha(BLUE.main, 0.13)} 0%, transparent 65%),
            radial-gradient(ellipse 70% 45% at 85% 105%, ${alpha(GOLD.main, 0.07)} 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 50%  50%, ${alpha(BLUE.deeper, 0.06)} 0%, transparent 70%)
          `,
          minHeight: "100vh",
          scrollbarWidth: "thin",
          scrollbarColor: `${alpha("#94A3B8", 0.18)} transparent`,
        },
        "::-webkit-scrollbar": { width: 5 },
        "::-webkit-scrollbar-track": { background: "transparent" },
        "::-webkit-scrollbar-thumb": {
          background: alpha("#94A3B8", 0.18),
          borderRadius: 99,
          "&:hover": { background: alpha("#94A3B8", 0.3) },
        },
      },
    },

    // ── Button ──
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "10px 22px",
          transition: "all 0.18s ease",
          "&:active": { transform: "scale(0.97)" },
        },
        // Primary = Blue gradient
        contained: {
          background: `linear-gradient(135deg, ${BLUE.light} 0%, ${BLUE.main} 50%, ${BLUE.dark} 100%)`,
          boxShadow: `0 4px 14px ${alpha(BLUE.main, 0.38)}`,
          "&:hover": {
            background: `linear-gradient(135deg, #60A5FA 0%, ${BLUE.light} 50%, ${BLUE.main} 100%)`,
            boxShadow: `0 6px 22px ${alpha(BLUE.main, 0.5)}`,
          },
        },
        // Secondary = Gold
        containedSecondary: {
          background: `linear-gradient(135deg, ${GOLD.light} 0%, ${GOLD.main} 50%, ${GOLD.dark} 100%)`,
          color: GOLD.contrastText,
          boxShadow: `0 4px 14px ${alpha(GOLD.main, 0.35)}`,
          "&:hover": {
            background: `linear-gradient(135deg, #FDE68A 0%, ${GOLD.light} 50%, ${GOLD.main} 100%)`,
            boxShadow: `0 6px 22px ${alpha(GOLD.main, 0.48)}`,
          },
        },
        outlined: {
          borderColor: alpha(BLUE.main, 0.45),
          "&:hover": {
            borderColor: BLUE.main,
            backgroundColor: alpha(BLUE.main, 0.07),
          },
        },
        outlinedSecondary: {
          borderColor: alpha(GOLD.main, 0.45),
          color: GOLD.main,
          "&:hover": {
            borderColor: GOLD.main,
            backgroundColor: alpha(GOLD.main, 0.07),
          },
        },
        text: {
          "&:hover": { backgroundColor: alpha(BLUE.main, 0.06) },
        },
        textSecondary: {
          color: GOLD.main,
          "&:hover": { backgroundColor: alpha(GOLD.main, 0.06) },
        },
      },
    },

    // ── Card ──
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: BG.paper,
          border: `1px solid ${alpha("#94A3B8", 0.1)}`,
          borderRadius: 16,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            borderColor: alpha(BLUE.main, 0.38),
            boxShadow: `0 8px 30px ${alpha("#000", 0.36)}`,
          },
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: { padding: "20px 24px", "&:last-child": { paddingBottom: 20 } },
      },
    },

    MuiCardHeader: {
      styleOverrides: {
        root: { padding: "20px 24px 0" },
        title: { fontWeight: 600, fontSize: "1rem" },
      },
    },

    // ── TextField / Input ──
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: alpha("#94A3B8", 0.05),
          "& fieldset": { borderColor: alpha("#94A3B8", 0.16) },
          "&:hover fieldset": { borderColor: alpha(BLUE.main, 0.5) },
          "&.Mui-focused fieldset": {
            borderColor: BLUE.main,
            borderWidth: 1.5,
            boxShadow: `0 0 0 3px ${alpha(BLUE.main, 0.12)}`,
          },
        },
        input: { padding: "12px 16px" },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: TEXT.secondary,
          "&.Mui-focused": { color: BLUE.light },
        },
      },
    },

    // ── Chip ──
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500, fontSize: "0.8rem" },
        colorPrimary: {
          backgroundColor: alpha(BLUE.main, 0.15),
          color: BLUE.light,
          "&:hover": { backgroundColor: alpha(BLUE.main, 0.25) },
        },
        colorSecondary: {
          backgroundColor: alpha(GOLD.main, 0.15),
          color: GOLD.main,
          "&:hover": { backgroundColor: alpha(GOLD.main, 0.25) },
        },
        colorSuccess: {
          backgroundColor: alpha("#10B981", 0.14),
          color: "#34D399",
        },
        colorError: {
          backgroundColor: alpha("#EF4444", 0.14),
          color: "#FCA5A5",
        },
      },
    },

    // ── Paper ──
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", backgroundColor: BG.paper, border: `1px solid ${alpha("#94A3B8", 0.08)}` },
        elevation3: { backgroundColor: BG.elevated, border: `1px solid ${alpha("#94A3B8", 0.12)}` },
        elevation8: { backgroundColor: BG.overlay, border: `1px solid ${alpha("#94A3B8", 0.14)}` },
      },
    },

    // ── AppBar ──
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: alpha(BG.default, 0.8),
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${alpha("#94A3B8", 0.1)}`,
        },
      },
    },

    // ── Drawer ──
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: BG.elevated,
          border: "none",
          borderRight: `1px solid ${alpha("#94A3B8", 0.1)}`,
        },
      },
    },

    // ── Dialog ──
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: BG.elevated,
          border: `1px solid ${alpha("#94A3B8", 0.15)}`,
          borderRadius: 20,
          backgroundImage: "none",
        },
      },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 600, fontSize: "1.1rem" } } },
    MuiDialogContent: { styleOverrides: { root: { padding: "20px 24px !important" } } },

    // ── Table ──
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            backgroundColor: alpha("#94A3B8", 0.05),
            color: TEXT.secondary,
            fontWeight: 600,
            fontSize: "0.72rem",
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            borderBottom: `1px solid ${alpha("#94A3B8", 0.12)}`,
            padding: "12px 16px",
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          "& .MuiTableRow-root": {
            transition: "background 0.14s",
            "&:hover": { backgroundColor: alpha("#94A3B8", 0.04) },
            "& .MuiTableCell-root": {
              borderBottom: `1px solid ${alpha("#94A3B8", 0.07)}`,
              padding: "14px 16px",
            },
          },
          "& .MuiTableRow-root:last-child .MuiTableCell-root": { border: "none" },
        },
      },
    },

    // ── Tabs ──
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          color: TEXT.secondary,
          minWidth: 80,
          "&.Mui-selected": { color: BLUE.light, fontWeight: 600 },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: `linear-gradient(90deg, ${BLUE.main}, ${BLUE.light})`,
          borderRadius: 99,
          height: 3,
        },
      },
    },

    // ── Linear Progress ──
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 6, backgroundColor: alpha(BLUE.main, 0.14) },
        bar: { borderRadius: 99 },
        colorPrimary: {
          "& .MuiLinearProgress-bar": { background: `linear-gradient(90deg, ${BLUE.main}, ${BLUE.light})` },
        },
        colorSecondary: {
          "& .MuiLinearProgress-bar": { background: `linear-gradient(90deg, ${GOLD.dark}, ${GOLD.main})` },
        },
      },
    },

    // ── Switch ──
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": { color: BLUE.light },
          "&.Mui-checked + .MuiSwitch-track": { backgroundColor: alpha(BLUE.main, 0.55), opacity: 1 },
        },
        track: { backgroundColor: alpha("#94A3B8", 0.28), opacity: 1 },
      },
    },

    // ── Tooltip ──
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: BG.overlay,
          border: `1px solid ${alpha("#94A3B8", 0.18)}`,
          color: TEXT.primary,
          fontSize: "0.8rem",
          borderRadius: 8,
          padding: "7px 13px",
          boxShadow: `0 6px 20px ${alpha("#000", 0.4)}`,
        },
        arrow: { color: BG.overlay },
      },
    },

    // ── Avatar ──
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(BLUE.main, 0.2),
          color: BLUE.light,
          fontWeight: 600,
        },
        colorDefault: {
          backgroundColor: alpha(GOLD.main, 0.18),
          color: GOLD.main,
        },
      },
    },

    // ── Skeleton ──
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: alpha("#94A3B8", 0.09) },
        wave: {
          "&::after": { background: `linear-gradient(90deg, transparent, ${alpha("#94A3B8", 0.05)}, transparent)` },
        },
      },
    },

    // ── Alert ──
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, border: "1px solid", alignItems: "center", fontSize: "0.875rem" },
        standardSuccess: {
          backgroundColor: alpha("#10B981", 0.1),
          borderColor: alpha("#10B981", 0.22),
          color: "#34D399",
        },
        standardError: {
          backgroundColor: alpha("#EF4444", 0.1),
          borderColor: alpha("#EF4444", 0.22),
          color: "#FCA5A5",
        },
        standardWarning: {
          backgroundColor: alpha(GOLD.main, 0.1),
          borderColor: alpha(GOLD.main, 0.22),
          color: GOLD.light,
        },
        standardInfo: { backgroundColor: alpha(BLUE.main, 0.1), borderColor: alpha(BLUE.main, 0.22), color: "#93C5FD" },
      },
    },

    // ── Fab ──
    MuiFab: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${BLUE.light}, ${BLUE.dark})`,
          boxShadow: `0 6px 24px ${alpha(BLUE.main, 0.45)}`,
          color: "#fff",
          "&:hover": {
            background: `linear-gradient(135deg, #60A5FA, ${BLUE.main})`,
            boxShadow: `0 8px 32px ${alpha(BLUE.main, 0.6)}`,
          },
        },
      },
    },

    // ── Bottom Navigation (mobile-first) ──
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(BG.elevated, 0.92),
          backdropFilter: "blur(24px)",
          borderTop: `1px solid ${alpha("#94A3B8", 0.1)}`,
          height: 64,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: TEXT.secondary,
          minWidth: "unset",
          transition: "color 0.15s",
          "&.Mui-selected": { color: BLUE.light },
          "& .MuiBottomNavigationAction-label": { fontSize: "0.7rem", fontWeight: 500, textTransform: "uppercase" },
        },
      },
    },

    // ── List items ──
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          "&.Mui-selected": {
            backgroundColor: alpha(BLUE.main, 0.14),
            color: BLUE.light,
            fontWeight: 600,
            "&:hover": { backgroundColor: alpha(BLUE.main, 0.2) },
          },
          "&:hover": { backgroundColor: alpha("#94A3B8", 0.06) },
        },
      },
    },

    // ── Badge ──
    MuiBadge: {
      styleOverrides: {
        badge: { fontWeight: 700, fontSize: "0.65rem", minWidth: 18, height: 18 },
      },
    },

    // ── Select ──
    MuiSelect: {
      styleOverrides: {
        icon: { color: TEXT.secondary },
      },
    },

    // ── Menu ──
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: BG.overlay,
          border: `1px solid ${alpha("#94A3B8", 0.15)}`,
          borderRadius: 12,
          boxShadow: `0 12px 40px ${alpha("#000", 0.5)}`,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "2px 6px",
          "&:hover": { backgroundColor: alpha(BLUE.main, 0.08) },
          "&.Mui-selected": {
            backgroundColor: alpha(BLUE.main, 0.14),
            "&:hover": { backgroundColor: alpha(BLUE.main, 0.2) },
          },
        },
      },
    },

    // ── Date Picker / Pickers (if using @mui/x-date-pickers) ──
    // MuiPickersDay: { styleOverrides: { root: { borderRadius: 8 }, today: { borderColor: BLUE.main } } },
  },
});
