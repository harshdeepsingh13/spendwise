---
description: Write or update unit tests for an edited source file, then run them to verify correctness. Invoked automatically by the post-edit hook or manually via /write-tests <file-path>.
---

You are a sub-agent triggered after a file edit. Write or update unit tests for the target file, run them, and report results.

**Target file:** $ARGUMENTS

## Hard rules
- Do NOT modify the source file unless a test reveals an obvious bug in it (and say so explicitly)
- Do NOT install packages; if `vitest` is missing from the workspace, print a clear message and stop
- Skip silently if the target is a test file (`*.test.*`, `*.spec.*`), a config file, `.md`, `.json`, or `.env`
- Co-locate the test file in the **same directory** as the source: `Foo.jsx` → `Foo.test.jsx`

## Step 1 — Read & classify
- Read the target file fully
- Determine workspace: does the path start with the `client/` subtree or `server/` subtree?
- List every exported function, class, React component, and custom hook

## Step 2 — Verify test framework
- Client: check `client/package.json` for `vitest` in devDependencies
- Server: check `server/package.json` for `vitest` in devDependencies
- If missing: output `[write-tests] vitest not found — run: cd <workspace> && npm install --save-dev vitest` and stop

## Step 3 — Find or create the test file
- Path convention: same directory, same base name, `.test.js` / `.test.jsx` extension
- If the test file already exists, read it to understand current coverage before writing

## Step 4 — Write tests

### React components (client/src/components/, client/src/pages/)
```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)
```
Cover: renders without crashing, key text/elements appear, primary user interactions.

### Custom hooks (client/src/hooks/)
Use `renderHook` from `@testing-library/react` with the `wrapper` above.
Mock the axios instance: `vi.mock('../lib/axios')`
Cover: initial state, loading state, success response, error response.

### Client services (client/src/services/)
Mock axios: `vi.mock('../lib/axios')`
Cover: correct URL called, correct payload sent, return value matches mock response, error propagation.

### Express controllers (server/src/controllers/)
Create mock req/res/next:
```js
const req = { user: { _id: 'user123' }, body: {}, params: {}, query: {} }
const res = { json: vi.fn(), status: vi.fn().mockReturnThis() }
const next = vi.fn()
```
Mock Mongoose models: `vi.mock('../models/Expense.model.js')`
Cover: happy path response shape, missing param → error, DB error → next(err).

### Server services (server/src/services/)
Mock external SDKs (cloudinary, tesseract) with `vi.mock()`.
Cover: core logic paths and error handling.

### Pure utility/config files
Direct input → output assertions; no mocks needed.

## Step 5 — Run the tests
Determine the workspace root (e.g. `client/` or `server/`) and run:
```bash
cd <workspace-root> && npx vitest run <relative-path-to-test-file> --reporter=verbose
```

## Step 6 — Fix and retry (max 3 attempts)
- On failure, read the error output carefully
- Fix the **test** (not the source) unless the error clearly indicates a source bug
- Re-run after each fix

## Step 7 — Report
One short paragraph: test file path, how many tests were written/updated, pass/fail status, any unresolved issues.
