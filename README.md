# SpendWise

A MERN stack expense tracking application with OAuth authentication, receipt photo capture with OCR, and analytics.

## Stack

- **Frontend**: React 18 + Vite + MUI + React Router + TanStack Query
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Authentication**: Passport.js (Google, GitHub OAuth)
- **File Storage**: Cloudinary
- **OCR**: Tesseract.js

## Project Structure

```
spendwise/
├── server/          # Node.js + Express backend
│   ├── src/
│   │   ├── config/     # Database, Passport, Cloudinary, Env
│   │   ├── models/     # Mongoose schemas
│   │   ├── routes/     # API route handlers
│   │   ├── controllers/# Route logic
│   │   ├── middleware/ # Auth, upload, error handling
│   │   └── services/   # Business logic (OCR)
│   └── package.json
│
└── client/          # React + Vite frontend
    ├── src/
    │   ├── lib/       # Axios, QueryClient, Query Keys
    │   ├── services/  # API client functions
    │   ├── hooks/     # TanStack Query + custom hooks
    │   ├── pages/     # Page components
    │   ├── components/# Reusable components
    │   ├── context/   # Auth context
    │   ├── theme/     # MUI theme
    │   ├── main.jsx   # Entry point
    │   └── App.jsx    # Route declarations
    └── package.json
```

## Setup

### Prerequisites

- Node.js 16+
- MongoDB running locally or Atlas connection string
- Google OAuth credentials
- GitHub OAuth credentials
- Cloudinary account

### Installation

1. Install dependencies (npm workspaces):
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   # Copy .env.example to .env for base config (can be committed with defaults)
   cp .env.example .env
   
   # For local development, also create .env.local (gitignored, local overrides only)
   cp .env.example .env.local
   
   # Edit .env.local with your local credentials:
   # - MONGODB_URI
   # - JWT_SECRET
   # - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
   # - GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
   # - CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
   ```

3. Start development servers:
   ```bash
   npm run dev
   ```
   - Server: http://localhost:5000
   - Client: http://localhost:5173

## API Endpoints

### Authentication
- `GET /api/auth/google` - OAuth with Google
- `GET /api/auth/github` - OAuth with GitHub
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout (protected)

### Expenses (protected)
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Categories (protected)
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `DELETE /api/categories/:id` - Delete category

### Receipts (protected)
- `POST /api/receipts/upload` - Upload receipt photo
- `GET /api/receipts/:id/ocr-status` - Poll OCR status

### Analytics (protected)
- `GET /api/analytics/dashboard` - Dashboard summary
- `GET /api/analytics/monthly?year=2026&month=4` - Monthly breakdown
- `GET /api/analytics/yearly?year=2026` - Yearly breakdown

## Key Features

### OAuth Flow
1. User clicks "Sign in with Google/GitHub"
2. Redirects to Passport OAuth strategy
3. Server creates/upserts user and signs JWT
4. Redirects to `http://localhost:5173/auth/callback?token=<JWT>`
5. Client reads token and stores in localStorage
6. All subsequent API requests include `Authorization: Bearer <token>`

### Receipt OCR
1. Upload file to `/api/receipts/upload` (multipart)
2. Server streams to Cloudinary, creates Receipt with `ocrStatus: 'pending'`
3. Async Tesseract OCR runs fire-and-forget
4. Client polls `/api/receipts/:id/ocr-status` every 2 seconds
5. When done, amount is extracted via regex and returned

### Analytics
- Dashboard: Current month vs last month (MoM %)
- Monthly: Daily breakdown by category
- Yearly: Monthly totals by category
- All use MongoDB aggregation pipelines for efficiency

## Data Fetching

All data fetching follows TanStack Query patterns:
- `useQuery` for GET requests (read-only data)
- `useMutation` for POST/PUT/DELETE (writes)
- Query keys centralized in `lib/queryKeys.js`
- Automatic cache invalidation on mutations
- Polling for OCR status with auto-stop

## Styling

- MUI `sx` prop throughout
- All colors defined in `theme/theme.js`
- No hardcoded color values
- Responsive design with MUI's Grid and Container

## Development Notes

- Local development: Create `.env.local` with your local credentials (overrides `.env`)
- Production: Use `.env` only (`.env.local` is gitignored)
- Server requires MongoDB connection to start
- OAuth credentials needed for login testing
- Cloudinary upload requires valid API credentials for receipt upload
- Tesseract OCR requires internet connection for model downloads

