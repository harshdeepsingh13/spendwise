<div align="center">

# SpendWise

**Know where every dollar goes.**

A full-stack expense tracker with AI-powered receipt scanning, real-time analytics, and budget intelligence — built on the MERN stack.

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![MUI](https://img.shields.io/badge/MUI_v5-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org)

</div>

---

## What is SpendWise?

SpendWise is a personal finance app that replaces the spreadsheet. You log expenses, photograph receipts (OCR extracts the amount for you), set budgets per category, and watch real-time analytics tell you exactly where your money is going — month over month, year over year.

It ships with a 3D animated landing page, Google and GitHub OAuth, optional TOTP two-factor authentication, and a polished dark UI that runs on any screen size.

---

## Features

### Smart Expense Management
Track every transaction with custom categories, tags, and dates. Filter and search your full history instantly. Attach a scanned receipt to any expense in one click.

### AI-Powered Receipt OCR
Upload a photo of any receipt. SpendWise streams it to Cloudinary, runs Tesseract.js OCR in the background, and extracts the total automatically — no manual entry required. Status updates in real time via polling.

### Real-Time Analytics Dashboard
- **Month-over-month spend change** with percentage delta
- **Category donut chart** — see where the bulk of spending lands
- **Daily spending trend** line chart for the current month
- **KPI health score** — how many budgets are on track right now
- **Recent activity feed** with receipt thumbnails

### Budget Intelligence
Set a monthly budget for any category. Progress bars update live as you spend. Color-coded thresholds warn you at 80% before you hit 100%. A budget health score summarises your financial discipline at a glance.

### Monthly & Yearly Analytics
Drill into any month for a day-by-day breakdown by category, or zoom out to a full year to spot seasonal patterns and compare months side by side.

### Secure Authentication
- Google OAuth and GitHub OAuth via Passport.js
- Email + password sign-up with strength enforcement
- Access token + refresh token rotation
- Optional TOTP two-factor authentication (QR code setup, disable with confirmation)
- JWT-protected API with rate limiting and Helmet security headers

### Polished UI
- Deep navy dark theme with Royal Blue + Gold accent palette
- DM Sans typography, 12px+ border radii, subtle gradients
- Mobile-first responsive layout — works cleanly at 375px
- Glassmorphism app bar, animated skeleton loaders, scroll reveal on landing
- Interactive 3D WebGL hero scene powered by Three.js

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6 |
| **UI Library** | Material UI v5 (custom theme, `sx` prop throughout) |
| **Data Fetching** | TanStack Query v5 — `useQuery` / `useMutation` with cache invalidation |
| **3D / Animation** | Three.js, CSS keyframes, scroll-reveal hooks |
| **Backend** | Node.js, Express, Mongoose (Route → Controller → Service pattern) |
| **Database** | MongoDB — Decimal128 amounts, compound indexes, aggregation pipelines |
| **Auth** | Passport.js (Google, GitHub), JWT, bcryptjs, speakeasy TOTP |
| **File Storage** | Cloudinary (stream upload) |
| **OCR** | Tesseract.js (fire-and-forget, regex amount extraction) |
| **Security** | Helmet, express-rate-limit, refresh token rotation |
| **Testing** | Vitest + React Testing Library — 90+ tests across models, services, controllers, hooks, and components |

---

## Getting Started

**Prerequisites:** Node.js 18+, MongoDB, Cloudinary account, Google/GitHub OAuth credentials.

```bash
# 1. Clone and install
git clone https://github.com/harshdeepsingh13/spendwise.git
cd spendwise
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in MONGODB_URI, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET,
# GITHUB_CLIENT_ID/SECRET, CLOUDINARY credentials

# 3. Run both server and client
npm run dev
# Server → http://localhost:5000
# Client → http://localhost:5173
```

All required environment variables are documented in `.env.example`.

---

## Roadmap

The following features are planned or in progress:

- [ ] **CSV & PDF export** — download expense history as a spreadsheet or report
- [ ] **Recurring expenses** — mark subscriptions and fixed bills, auto-log monthly
- [ ] **Plaid bank sync** — connect accounts to import transactions automatically
- [ ] **AI spending insights** — LLM-generated weekly summaries and anomaly detection
- [ ] **Multi-currency support** — live exchange rates, store amounts in base currency
- [ ] **Shared expenses** — split bills with other users, settle balances
- [ ] **Budget alerts** — email / push notification when a category hits 80%
- [ ] **Browser extension** — one-click expense capture from any checkout page
- [ ] **React Native mobile app** — full feature parity on iOS and Android
- [ ] **Light theme** — system preference detection toggle in-app

---

## Architecture Highlights

For engineers reading this: the server follows a strict **Route → Controller → Service** three-layer pattern. Controllers are pure HTTP boundary code — they parse request params and call exactly one service function. All business logic, DB queries, and external calls (Cloudinary, OCR) live in services. Services throw plain `Error` objects with a `.status` property; the global error handler responds accordingly.

On the client, all server state lives in TanStack Query. Services are plain async functions with no hooks. Hooks wrap `useQuery` / `useMutation` and handle cache invalidation. No `fetch` or `axios` calls appear in components directly. Query keys are centralised in `lib/queryKeys.js`.

---

<div align="center">

Built with care by [Harshdeep Singh](https://github.com/harshdeepsingh13)

</div>
