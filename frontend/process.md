# Frontend Development Process

Step-by-step record of how this React frontend was built from scratch.

---

## Step 1: Scaffold the Project

```bash
cd C:\Users\Admin\Desktop\Spring\Student_Management
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

Vite generates the base React project with `src/`, `index.html`, `vite.config.js`.

---

## Step 2: Install Dependencies

```bash
npm install axios react-router-dom react-hot-toast lucide-react recharts
```

| Package | Why |
|---------|-----|
| `axios` | HTTP requests to Spring Boot backend |
| `react-router-dom` | SPA routing (login, dashboard, account detail, etc.) |
| `react-hot-toast` | Non-blocking toast notifications |
| `lucide-react` | Clean SVG icons |
| `recharts` | Charts for dashboard stats |

---

## Step 3: Install Tailwind CSS v3

```bash
npm install -D tailwindcss@3 postcss autoprefixer
./node_modules/.bin/tailwindcss init -p
```

> Note: `npx tailwindcss init` may fail with "could not determine executable to run".
> Use the direct path `./node_modules/.bin/tailwindcss init -p` instead.

Edit `tailwind.config.js`:
```js
content: ['./index.html', './src/**/*.{js,jsx}'],
theme: { extend: { fontFamily: { sans: ['Inter', 'sans-serif'] } } }
```

Edit `src/index.css` -- add Google Fonts import BEFORE Tailwind directives:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary  { @apply ... }
  .input-field  { @apply ... }
  .card         { @apply ... }
}
```

> Note: `@import` must appear before `@tailwind` directives or Vite will warn.

---

## Step 4: Configure Vite Proxy

Edit `vite.config.js` to proxy backend API calls (avoids CORS in dev):

```js
server: {
  port: 3000,
  proxy: {
    '/api':  { target: 'http://localhost:8080', changeOrigin: true },
    '/auth': { target: 'http://localhost:8080', changeOrigin: true },
  },
}
```

With this setup, `axios.get('/api/accounts')` in the frontend reaches
`http://localhost:8080/api/accounts` transparently.

---

## Step 5: Axios Instance + JWT Interceptor

Created `src/api/axios.js`:
- `baseURL: ''` (proxy handles routing)
- Request interceptor: reads `token` from `localStorage`, adds `Authorization: Bearer <token>`
- Response interceptor: on 401/403, clears token and redirects to `/login`

---

## Step 6: Auth Context

Created `src/context/AuthContext.jsx` with React Context + `useState`:
- `loginUser(token, userData)` -- saves to state and `localStorage`
- `logoutUser()` -- clears state and `localStorage`
- `user` object: `{ userId, username, role }`

Wrapped `<App>` with `<AuthProvider>` so all pages can call `useAuth()`.

---

## Step 7: Protected Route

Created `src/components/ProtectedRoute.jsx`:
- Reads token from `localStorage`
- If missing: redirects to `/login`
- If present: renders `children`

Used in `App.jsx` for all authenticated routes.

---

## Step 8: Group 1 -- Core Banking Pages

Built in this order:

1. **Login.jsx** -- form with username/password, show/hide password toggle, calls `auth.login()`, stores JWT, navigates to `/dashboard`
2. **Register.jsx** -- same form plus role selector (CUSTOMER/ADMIN)
3. **Navbar.jsx** -- sticky top bar, nav links (Dashboard, Transfer), user dropdown (My Profile, Logout)
4. **Dashboard.jsx** -- fetches all accounts, 4 stat cards (total accounts, active, total balance, savings), accounts table with row click navigation, create account modal
5. **AccountDetail.jsx** -- fetches account + balance, gradient account card, deposit/withdraw modals with quick-select amounts, paginated transaction history
6. **Transfer.jsx** -- transfer form with live summary card, success screen with confetti-style feedback

---

## Step 9: Group 2 -- Account Management

Added to existing files:

- `accounts.js`: added `closeAccount`, `updateName`, `searchByName`, `getMiniStatement`
- **Dashboard.jsx**: replaced client-side name filter with backend `searchByName` call on form submit; added clear (X) button to reset search
- **AccountDetail.jsx**:
  - "Edit Name" button opens modal calling `updateName`
  - "Close Account" button opens confirmation modal calling `closeAccount`
  - Added "Mini Statement" tab that lazy-loads last 5 transactions on first click

---

## Step 10: Group 3 -- Advanced Features

Added new files and extended AccountDetail:

- `accounts.js`: added `getTransactionsByDate`, `calculateInterest`
- `src/api/users.js` (new): `getProfile`, `changePassword`
- **Profile.jsx** (new page):
  - Shows user info in a card (avatar with first letter, username, email, role, user ID)
  - Change password form: current password, new password (with strength bar), confirm password (with match validation)
- **Navbar.jsx**: added "My Profile" link in dropdown (navigates to `/profile`)
- **AccountDetail.jsx**:
  - Added "By Date" tab: date range picker form, calls `getTransactionsByDate`, shows results list or empty state
  - Added "Interest" tab (SAVINGS accounts only): shows monthly + yearly interest projection from backend, calculation details breakdown, info note
- **App.jsx**: added `/profile` route

---

## Step 11: Group 4 -- Admin & Export

Added new API file and extended Dashboard + AccountDetail:

- `src/api/admin.js` (new): `getAdminDashboard` — calls `GET /api/admin/dashboard`
- `accounts.js`: added `globalSearch`, `softDeleteAccount`, `exportAccountsCsv` (responseType: blob), `exportTransactionsCsv` (responseType: blob)
- **Dashboard.jsx**:
  - Search mode toggle (Name vs Global) — "Name" calls `searchByName`, "Global" calls `globalSearch` (searches both name and account number)
  - "Admin Stats" button (visible to ADMIN role only) — opens inline stats panel with 8 stat tiles covering accounts, balances, deposits, withdrawals, and transactions
  - "Export CSV" button in welcome banner — calls `exportAccountsCsv`, triggers browser file download via `URL.createObjectURL`
  - Soft delete (trash icon) on each account row — opens confirmation modal showing account details before calling `softDeleteAccount`
- **AccountDetail.jsx**:
  - "CSV" button in transaction tabs header area — calls `exportTransactionsCsv(id)`, triggers browser download of `transactions_account_{id}.csv`
  - `downloadBlob` helper defined locally in Dashboard (inline in AccountDetail) to avoid creating a separate utility

**CSV download pattern** (avoids CORS + works with JWT auth):
```js
const { data } = await exportAccountsCsv(); // responseType: 'blob' in axios call
const url = window.URL.createObjectURL(data);
const a = document.createElement('a');
a.href = url; a.download = 'accounts.csv';
document.body.appendChild(a); a.click(); a.remove();
window.URL.revokeObjectURL(url);
```

---

## Step 12: App.jsx Routing

Final route table:
```jsx
<Route path="/login"       element={<Login />} />
<Route path="/register"    element={<Register />} />
<Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
<Route path="/accounts/:id" element={<ProtectedRoute><AccountDetail /></ProtectedRoute>} />
<Route path="/transfer"    element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
<Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />
<Route path="*"            element={<Navigate to="/dashboard" replace />} />
```

---

## Design Decisions

| Decision | Reason |
|----------|--------|
| Vite proxy instead of CORS config | Simpler -- no backend changes needed during dev |
| `localStorage` for JWT | Simple persistence; auth context syncs on refresh |
| `@layer components` in Tailwind | Reusable class names (btn-primary, card, input-field) without JS overhead |
| Lazy tab loading (mini statement, interest) | Avoid unnecessary API calls on page load |
| Strength bar for password | Better UX feedback without external library |
| Interest tab only for SAVINGS | CURRENT accounts don't earn interest in this system |
| `react-hot-toast` over alerts | Non-blocking, dismissable, matches modern UI |
| `responseType: 'blob'` for CSV export | Axios must be told to expect binary data; default `json` would corrupt the file |
| `URL.createObjectURL` for download | Works with JWT auth -- no new browser tab, no direct URL exposure |
| Admin Stats panel inline (not new page) | Keeps admin experience in the dashboard without extra routes |
| Global search toggle (Name / Global) | Lets users choose precision (name-only) vs breadth (name + account number) |
| Soft delete with confirmation modal | Destructive action needs user intent confirmation; shows account details before proceeding |

---

## Running the App

```bash
# Terminal 1: Start Spring Boot backend
cd C:\Users\Admin\Desktop\Spring\Student_Management
mvn spring-boot:run

# Terminal 2: Start React frontend
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.
