# Context

Integrate **TanStack Query (React Query v5)** into the expense-tracker frontend to replace manual `useState`/`useEffect` data fetching patterns. This will provide:

- **Automatic caching** - Prevents redundant API calls
- **Query invalidation** - Data refreshes automatically after mutations
- **Loading states** - Built-in loading indicators
- **Error handling** - Centralized error management
- **Infinite queries** - For paginated expense lists

## Paths to Modify

### Service Files (No changes needed - API endpoints stay same)
- `client/src/services/api.js` - Axios config (existing)
- `client/src/services/expenseService.js`
- `client/src/services/analyticsService.js`
- `client/src/services/receiptService.js`
- `client/src/services/categoryService.js`
- `client/src/services/authService.js`

### Pages to Update
- `client/src/pages/Dashboard.jsx` - Dashboard with charts and recent expenses
- `client/src/pages/Expenses.jsx` - Expense list with pagination
- `client/src/pages/Analytics.jsx` - Analytics charts and data
- `client/src/pages/Receipts.jsx` - Receipt upload and management
- `client/src/pages/Settings.jsx` - Profile updates
- `client/src/pages/Login.jsx` - Login form
- `client/src/pages/Register.jsx` - Registration form

## Implementation Strategy

### 1. Install TanStack Query
```bash
cd client && npm install @tanstack/react-query
```

### 2. Create Query Client
- Add `QueryClient` and `QueryClientProvider` to `main.jsx`

### 3. Update Pages with TanStack Query Hooks
Replace `useState`/`useEffect` patterns with:
- `useQuery()` - For fetching data (GET requests)
- `useMutation()` - For mutations (POST/PUT/DELETE)
- `useQueryClient()` - For cache invalidation after mutations

### 4. Query Key Pattern
Use consistent key formatting:
```javascript
const expenseQueries = {
  expenses: ['expenses'],
  expense: (id) => ['expenses', id],
  categories: ['categories'],
  dashboard: ['dashboard'],
  monthly: (year, month) => ['analytics', 'monthly', year, month],
};
```

## Verification

1. Run `npm install` in client directory
2. Update `main.jsx` with `QueryClientProvider`
3. Update each page component to use TanStack Query hooks
4. Start dev server and verify:
   - Dashboard loads with cached analytics data
   - Expenses page paginates correctly with loading states
   - Creating/deleting expenses invalidates cache automatically
   - OCR status polling works with `useInterval` or `useEffect`

## Expected Outcome

- Cleaner, more maintainable data fetching code
- No duplicate API calls due to caching
- Better UX with loading skeletons and error states
- Simplified mutation handling with auto-refetch
