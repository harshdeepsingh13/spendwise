# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start both server (PORT env var, default 5000) and client (5173) concurrently
```

From individual package directories:
```bash
cd server && npm run dev     # Start server with --watch
cd client && npm run dev     # Start Vite dev server
```

### Build & Preview
```bash
npm run build        # Build both server and client
cd client && npm run preview  # Preview production build locally
```

### Environment Setup
1. Copy `.env.example` to `.env` at the root (base config, can have defaults)
2. For local development, also create `.env.local` with your credentials (gitignored, overrides `.env`)
3. In production, only `.env` is used (`.env.local` won't exist)
4. See `server/src/config/env.js` for required variables
5. Note: Server requires `PORT` env var or defaults to 5000; client proxy is currently set to 8001 in `vite.config.js`

## Architecture

### Monorepo Structure (npm workspaces)
- **Root**: Orchestrates `server` and `client` packages via `concurrently` in dev/build scripts
- **Server** (`server/src`): Express app on Node.js with Mongoose/MongoDB
- **Client** (`client/src`): React 18 + Vite with MUI + TanStack Query v5

### Backend Organization

**Core files** (essential for any API change):
- `config/env.js` — Validates required env vars on startup (fail-fast)
- `config/db.js` — MongoDB/Mongoose connection
- `config/passport.js` — OAuth strategies (Google, GitHub) with JWT signing
- `app.js` — Express app factory: middleware stack + route mounting
- `index.js` — Entry point: validates env → connects DB → starts server

**Data Layer**:
- `models/` — Mongoose schemas (User, Expense, Category, Receipt)
- Routes + Controllers + Services follow a strict three-layer pattern:
  - **Routes** — define endpoints and attach middleware only
  - **Controllers** — parse req (body/params/query/user), call one service function, send res.json(); catch errors with next(err)
  - **Services** — all DB queries, business logic, external service calls, and ownership checks; throw `Error` with `.status` set for known errors (404, 409, etc.)
  - All protected routes use `authMiddleware` to inject `req.user`

**Services** (`services/`):
- `services/auth.service.js` — createUser, authenticateUser, signTokenForUser; handles bcrypt + JWT
- `services/expense.service.js` — CRUD operations on Expense model with ownership checks
- `services/category.service.js` — CRUD operations on Category model
- `services/receipt.service.js` — Receipt CRUD; orchestrates Cloudinary upload and OCR trigger
- `services/analytics.service.js` — MongoDB aggregation pipelines for dashboard/monthly/yearly views
- `services/cloudinary.service.js` — uploadToCloudinary (stream wrapper), destroyCloudinaryAsset
- `services/ocr.service.js` — Fire-and-forget Tesseract OCR; updates Receipt doc when done

**Middleware** (`middleware/`):
- `auth.middleware.js` — Extracts JWT from `Authorization: Bearer <token>`, verifies with `env.JWT_SECRET`, attaches user to `req.user`
- `upload.middleware.js` — Multer with memory storage for file uploads
- `errorHandler.middleware.js` — Global error catcher

### Frontend Organization

**Entry & Config** (read first when onboarding):
- `main.jsx` — Root: QueryClientProvider + ThemeProvider + CssBaseline + AuthProvider
- `App.jsx` — Route definitions: /login, /signup, /auth/callback, / (dashboard), /expenses, /analytics, /receipts
- `context/AuthContext.jsx` — Token state (localStorage) + useAuthContext hook

**Data Fetching** (centralized):
- `lib/queryKeys.js` — All TanStack Query key factories (export keys used across hooks)
- `lib/axios.js` — Axios instance: baseURL `/api`, request interceptor adds `Authorization: Bearer <token>`, 401 response redirects to /login
- `lib/queryClient.js` — QueryClient singleton with defaults (staleTime 5m, gcTime 10m, retry 1)

**Services** (`services/`):
- Pure async functions, no hooks/state; called by hooks
- `auth.service.js` — login, signup, getMe, logout
- `expense.service.js`, `category.service.js`, `receipt.service.js`, `analytics.service.js`

**Custom Hooks** (`hooks/`):
- Encapsulate TanStack Query logic
- Prefix pattern: `useQuery*` for reads, `use*Mutations` for writes
- Example: `useExpenses()` wraps `useQuery(queryKeys.expenses.all, ...)`
- Mutations invalidate related query caches on success:
  ```js
  useMutation({
    mutationFn: expenseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard });
    }
  })
  ```

  Always try to create reusable components, make a decision if you think we might need this component again.

**UI**:
- `pages/` — Full-page components (Login, Signup, Dashboard, Expenses, Analytics, Receipts)
- `components/` — Reusable UI (Layout, Charts, Forms, Dialogs)
  - `common/AppModal.jsx` — Reusable modal wrapper with title, close button, and actions section
  - `common/CustomDateModal.jsx` — Date range picker modal (uses AppModal); integrates MUI DatePicker with LocalizationProvider
- `theme/theme.js` — MUI theme with dual dark & light modes; uses `prefers-color-scheme` media query to auto-detect system preference; both themes use same color language (Blue primary, Gold secondary) but adjusted contrast for readability

## Key Patterns

### Authentication
1. User clicks "Sign in with Google" → POST to `/api/auth/google`
2. Passport strategy upserts User by `{ provider, providerId }`, signs JWT with `sub: userId`
3. Redirect to `http://client:5173/auth/callback?token=<jwt>`
4. `AuthCallback` component reads token from URL, calls `setToken(token)` → localStorage
5. Axios interceptor adds `Authorization: Bearer <token>` to all requests
6. Protected routes check `authMiddleware` → attaches `req.user` to request

**Email/password auth**:
- `POST /api/auth/signup` — Create local user, hash password with bcryptjs, return JWT
- `POST /api/auth/login` — Validate credentials, return JWT
- User.model has `password` field (optional, only for local auth) + `provider` enum (local, google, github)

### Data Fetching
- **All** GET requests → `useQuery` with centralized query keys
- **All** POST/PUT/DELETE → `useMutation` with `onSuccess` invalidations
- Polling example: OCR status polls `/api/receipts/:id/ocr-status` every 2s, auto-stops when `ocrStatus === 'done'`

### Query Key Strategy
Each domain (auth, expenses, categories, receipts, analytics) has a key object in `queryKeys.js`:
```js
expenses: {
  all: ['expenses'],           // Used for list queries
  list: (filters) => [...],    // Used for filtered queries
  detail: (id) => [...]        // Used for single expense
}
```
When expense is created/updated/deleted, invalidate `queryKeys.expenses.all` to refetch.

### Styling & Responsive Design
- **Dark & Light Themes**: Theme automatically switches based on `prefers-color-scheme` browser setting
  - Users can toggle theme in their OS Settings → Display/Appearance
  - Dark theme: Deep navy background (#0C1220), light text
  - Light theme: Clean light background (#F8FAFC), dark text
  - Both use identical Blue primary & Gold secondary color language
- **Mobile-first design**: All UI components must be designed for mobile first, then progressively enhanced for larger screens
- Use MUI's responsive `sx` prop with breakpoints: `sx={{ fontSize: { xs: '14px', md: '16px' } }}`
- Grid and Container components use responsive spacing/cols
- Test all pages on mobile viewport (375px width minimum)
- **All colors** defined in `theme/theme.js` palette
- Components use `sx={{ color: 'primary.main' }}` or `useTheme()` hook
- **No inline hex values** (e.g., `#1976d2`) anywhere in components
- MUI's `createTheme()` centralizes colors, typography, spacing

### OCR Flow (Fire & Forget)
1. `POST /api/receipts/upload` — Multer buffers file → stream to Cloudinary → create Receipt doc with `ocrStatus: 'pending'`
2. Return immediately with `{ receiptId }`
3. Backend async calls `ocr.service.processReceipt(receiptId, cloudinaryUrl)` in background
4. Tesseract.js recognizes text, regex extracts amount, updates Receipt: `ocrStatus: 'done'`, `ocrExtractedAmount`
5. Client polls via `useOcrStatus(receiptId)` hook with `refetchInterval: (data) => data?.ocrStatus === 'done' ? false : 2000`

### Date Filtering Pattern (Receipts Page)
- **Preset filters**: "This Week", "This Month", "This Year", "Last Year", "All Time" via `getDateRange()` helper
- **Custom date range**: Use `CustomDateModal` (built with `AppModal`) to let users pick start & end dates
- **State management**: `dateFilter` (preset) and `customDateRange` (object) — custom dates take priority
- **Query params**: Pass `{ startDate, endDate }` to `useReceipts()` hook; also supports tag filtering
- **Reset behavior**: Selecting a preset filter clears custom dates; custom dates clear when modal closes without apply

## Important Details

### Environment Variables
- Server loads `.env` first (base/production config), then `.env.local` in non-production environments (local overrides)
- `.env.local` is gitignored and only used in local development
- `config/env.js` resolves the path using `fileURLToPath` to handle ESM imports correctly
- Required vars will cause startup failure if missing (fail-fast pattern)
- Client does NOT read .env; it's built into the bundle at build time (Vite default)

### Port Configuration
- Server default: `process.env.PORT || 5000`
- Client: Always runs on 5173 (Vite default)
- Vite proxy to backend: Currently set to `http://localhost:8001` in `client/vite.config.js` (user custom; override with actual PORT if different)

### MongoDB & Indexes
- Expense model has compound index `{ user: 1, date: -1 }` for efficient sorting
- User model has sparse index on `{ provider, providerId }` for OAuth lookups
- All models include `user` reference (except User itself) for multi-tenant isolation

### Decimal128 for Amounts
- Expense.amount uses MongoDB Decimal128 type (not Number) to avoid float precision loss
- Aggregation pipelines use `$toDouble` when needed for calculations

## Testing Notes

- No dedicated test suite yet; manual testing is primary
- Test OAuth flow: Click provider button → consent → callback → dashboard
- Test email/password: Signup with new email → login → dashboard
- Test expense CRUD: Create → verify in list → update → delete
- Test OCR: Upload receipt → watch status → verify extracted amount
- Test analytics: Create expenses → dashboard shows MoM %, charts update

## File Reading Order for New Tasks

**For API changes**: `server/src/routes/* → controllers/* → models/* → services/*`  
**For data fetching**: `client/src/hooks/* → services/* → lib/queryKeys.js → lib/axios.js`  
**For styling**: `theme/theme.js → any component using sx prop`  
**For auth changes**: `server/src/config/passport.js → middleware/auth.middleware.js → client/context/AuthContext.jsx`
