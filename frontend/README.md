# StudentBank Frontend

React + Vite single-page application for the StudentBank Account Management System.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI library |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| React Router DOM | 6.x | Client-side routing |
| Axios | 1.x | HTTP client with interceptors |
| React Hot Toast | 2.x | Toast notifications |
| Lucide React | 0.x | Icon library |
| Recharts | 2.x | Charts (Dashboard stats) |

---

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── axios.js          # Axios instance + JWT interceptor
│   │   ├── auth.js           # login, register
│   │   ├── accounts.js       # All account + transaction API calls
│   │   ├── users.js          # Profile + change password
│   │   └── admin.js          # Admin dashboard stats
│   ├── components/
│   │   ├── Navbar.jsx        # Sticky top nav with user dropdown
│   │   ├── Spinner.jsx       # Loading spinner (sm/md/lg)
│   │   ├── Modal.jsx         # Reusable modal overlay
│   │   ├── StatCard.jsx      # Dashboard stat card
│   │   └── ProtectedRoute.jsx # Route guard (redirects to /login)
│   ├── context/
│   │   └── AuthContext.jsx   # Global auth state (user, token, login/logout)
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx
│   │   ├── accounts/
│   │   │   ├── AccountDetail.jsx
│   │   │   └── Transfer.jsx
│   │   └── profile/
│   │       └── Profile.jsx
│   ├── utils/
│   │   └── format.js         # formatCurrency, formatDate, getErrorMessage
│   ├── App.jsx               # Router + route definitions
│   ├── main.jsx              # React entry point
│   └── index.css             # Tailwind directives + custom component classes
├── index.html
├── vite.config.js            # Dev proxy -> localhost:8080
├── tailwind.config.js
└── postcss.config.js
```

---

## Pages & Routes

| Route | Page | Auth Required |
|-------|------|---------------|
| `/login` | Login | No |
| `/register` | Register | No |
| `/dashboard` | Dashboard | Yes |
| `/accounts/:id` | Account Detail | Yes |
| `/transfer` | Transfer | Yes |
| `/profile` | My Profile | Yes |
| `*` | Redirect to `/dashboard` | -- |

---

## Features by Group

### Group 1 -- Core Banking
- Login & Register with JWT token storage
- Dashboard: account list, stat cards, create account modal
- Account Detail: deposit, withdraw, paginated transaction history
- Transfer between accounts

### Group 2 -- Account Management
- Dashboard: search accounts by name (backend API call)
- Account Detail: Edit account holder name
- Account Detail: Close account (INACTIVE status)
- Account Detail: Mini Statement tab (last 5 transactions)

### Group 3 -- Advanced Features
- Account Detail: Date range filter on transactions
- Account Detail: Interest calculator (SAVINGS accounts only)
- Profile page: view user info (username, email, role, ID)
- Profile page: change password with strength indicator

### Group 4 -- Admin & Export
- Dashboard: global search by name OR account number (toggle between Name / Global mode)
- Dashboard: Admin Stats panel — live system stats (total/active/inactive accounts, balances, deposits, withdrawals, transactions)
- Dashboard: Export all accounts to CSV (one-click download)
- Dashboard: Soft delete account (marks as deleted in DB, with confirmation modal)
- Account Detail: Export transactions for that account to CSV

---

## Setup & Running

### Prerequisites
- Node.js 18+
- Spring Boot backend running on `localhost:8080`

### Install dependencies
```bash
cd frontend
npm install
```

### Start dev server
```bash
npm run dev
```
Opens at `http://localhost:3000`. API calls to `/api/**` and `/auth/**` are proxied to `http://localhost:8080`.

### Build for production
```bash
npm run build
```
Output in `dist/`. Serve with any static file server or Nginx.

---

## Environment

No `.env` file needed in development -- the Vite proxy handles backend routing.

For production, update `vite.config.js` proxy target or configure your web server to
reverse-proxy `/api` and `/auth` to the Spring Boot service.

---

## Reusable CSS Classes (index.css)

Defined with `@layer components` in Tailwind:

| Class | Usage |
|-------|-------|
| `.btn-primary` | Blue filled button |
| `.btn-secondary` | Gray outlined button |
| `.btn-danger` | Red filled button |
| `.btn-success` | Green filled button |
| `.input-field` | Styled text/number/date input |
| `.card` | White rounded panel with shadow |
| `.badge-active` | Green status badge |
| `.badge-inactive` | Red status badge |

---

## API Proxy (vite.config.js)

```js
proxy: {
  '/api': { target: 'http://localhost:8080', changeOrigin: true },
  '/auth': { target: 'http://localhost:8080', changeOrigin: true },
}
```

This avoids CORS in development. The JWT token is attached by the Axios interceptor on
every request automatically.
