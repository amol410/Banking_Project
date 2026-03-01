# Frontend Issues Faced

All issues encountered while building the React frontend, with root causes and fixes.

---

## Issue 1: `npx tailwindcss init` fails with "could not determine executable to run"

**Error:**
```
npm error could not determine executable to run
```

**Root Cause:**
`npx` on some Windows/npm setups cannot resolve the locally installed `tailwindcss` bin.

**Fix:**
Use the direct path to the binary instead:
```bash
./node_modules/.bin/tailwindcss init -p
```

---

## Issue 2: Vite warns about `@import` order in CSS

**Warning:**
```
@import must precede all other statements (besides @charset and @layer)
```

**Root Cause:**
Google Fonts `@import` was placed after the `@tailwind base` directive. CSS spec requires
`@import` to come before any other CSS rules.

**Fix:**
Move the `@import` to the very first line of `src/index.css`, before any `@tailwind` directive:
```css
@import url('https://fonts.googleapis.com/...');
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Issue 3: Axios 401 redirect causes infinite loop on `/login`

**Symptom:**
Logging out and navigating to `/login` sometimes triggered the 401 interceptor again,
causing a redirect loop.

**Root Cause:**
The response interceptor was firing even for the `/auth/login` request itself when credentials
were wrong, trying to redirect to `/login` from `/login`.

**Fix:**
Clear `localStorage` and use `window.location.href = '/login'` (hard redirect instead of
React Router `navigate`). Since the interceptor runs outside React component scope,
`window.location` is safer and breaks any potential loop by doing a full page reload.

---

## Issue 4: Protected route shows content flash before redirect

**Symptom:**
Protected pages briefly rendered before redirecting unauthenticated users to `/login`.

**Root Cause:**
`ProtectedRoute` checked `localStorage` synchronously but React rendered children before
the redirect completed.

**Fix:**
Return `<Navigate to="/login" replace />` immediately when no token is found. The `replace`
prop ensures the login page replaces the history entry so the back button doesn't go back to
the protected page.

---

## Issue 5: `useAuth()` returns `null` user after page refresh

**Symptom:**
Refreshing the page caused `user` to be `null` even with a valid token in `localStorage`.

**Root Cause:**
`AuthContext` initialized `user` state to `null`. On refresh, the stored token exists but
the user object was never re-hydrated from `localStorage`.

**Fix:**
In `AuthContext`, initialize state by reading from `localStorage`:
```js
const [user, setUser] = useState(() => {
  const stored = localStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
});
```

---

## Issue 6: Vite proxy not forwarding `/auth` routes

**Symptom:**
`POST /auth/login` returned a 404 in the browser even though Spring Boot had the endpoint.

**Root Cause:**
Initial `vite.config.js` only proxied `/api/**` but forgot `/auth/**`.

**Fix:**
Add both prefix rules to the proxy:
```js
proxy: {
  '/api':  { target: 'http://localhost:8080', changeOrigin: true },
  '/auth': { target: 'http://localhost:8080', changeOrigin: true },
}
```

---

## Issue 7: Tailwind classes not applying -- blank/unstyled page

**Symptom:**
Page rendered with no styles after adding Tailwind.

**Root Cause:**
`tailwind.config.js` content array was empty (`content: []`), so Tailwind purged all
generated classes in the output CSS.

**Fix:**
Set the content paths to cover all JSX files:
```js
content: ['./index.html', './src/**/*.{js,jsx}']
```

---

## Issue 8: `formatCurrency` showing `NaN` for balance

**Symptom:**
Balance showed as `NaN` on the Account Detail card immediately after navigating to the page.

**Root Cause:**
`balance` state was initialized to `null`. The card rendered before the API call completed,
and `Intl.NumberFormat` on `null` returns `NaN`.

**Fix:**
Use nullish coalescing in the JSX to fall back to `account?.balance` while the dedicated
balance fetch is loading:
```jsx
{formatCurrency(balance ?? account?.balance)}
```

---

## Issue 9: Mini Statement tab re-fetches on every click

**Symptom:**
Switching to the Mini Statement tab and back fetched the API every time.

**Root Cause:**
The `useEffect` that triggered `fetchMini` only checked `txTab === 'mini'`, not whether
data was already loaded.

**Fix:**
Add `miniTx.length === 0` as a guard so it only fetches when the list is empty:
```js
useEffect(() => {
  if (txTab === 'mini' && miniTx.length === 0) fetchMini();
}, [txTab, miniTx.length, fetchMini]);
```

---

## Issue 10: Date input `max` attribute not preventing future dates

**Symptom:**
Users could type future dates in the date range filter even though `max={today}` was set.

**Root Cause:**
HTML `max` attribute prevents the date picker UI from going past today but does not prevent
manual keyboard input in some browsers.

**Fix:**
Added server-side validation (Spring Boot rejects future dates). The frontend also shows a
toast error for `startDate > endDate` cases. This is a browser limitation -- `max` is a UI
hint only, not a hard enforcement.

---

## Issue 11: Interest tab appears for CURRENT accounts

**Symptom:**
The "Interest" tab was visible on CURRENT account pages, but the backend only supports
interest calculation for SAVINGS accounts, returning an error.

**Root Cause:**
Initial tab implementation did not check account type before rendering the Interest tab.

**Fix:**
Added a condition in JSX to render the Interest tab button only when `isSavings` is true:
```jsx
{isSavings && (
  <button onClick={() => setTxTab('interest')}>...</button>
)}
```

---

## Issue 12: `react-hot-toast` Toaster not showing notifications

**Symptom:**
`toast.success(...)` and `toast.error(...)` calls had no visible effect.

**Root Cause:**
The `<Toaster />` component was not mounted anywhere in the React tree.

**Fix:**
Added `<Toaster />` inside `App.jsx` at the top level (outside `<Routes>`):
```jsx
<AuthProvider>
  <BrowserRouter>
    <Toaster position="top-right" toastOptions={{ ... }} />
    <Routes>...</Routes>
  </BrowserRouter>
</AuthProvider>
```

---

## Issue 13: Transfer page shows stale "from account" options

**Symptom:**
After creating a new account on the Dashboard, switching to Transfer still showed
the old account list without the new account.

**Root Cause:**
The Transfer page fetched accounts once on mount and never refetched.

**Fix:**
Transfer.jsx re-fetches accounts on every mount (no caching) since the component
is unmounted when navigating away. This is acceptable for this project size.

---

## Issue 14: `ChevronDown` rotation animation glitch in Navbar dropdown

**Symptom:**
The dropdown chevron sometimes visually "jumped" when opening/closing quickly.

**Root Cause:**
The `rotate-180` Tailwind class change was not smooth because `transition-transform`
was applied but the `transform` origin was not centered by default.

**Fix:**
Added `transition-transform duration-200` and ensured the button has no conflicting
transform properties. The chevron now smoothly rotates 180 degrees on open.

---

## Issue 15: Password strength bar does not reset after successful change

**Symptom:**
After submitting a password change, the strength bar still showed for the cleared input.

**Root Cause:**
`pwDone` flag was set to true but `pwForm.newPassword` was reset to `''`. The strength bar
only rendered conditionally on `pwForm.newPassword`, so it did disappear -- but the `pwDone`
success banner remained visible until the user typed again.

**Fix:**
The existing logic was actually correct -- the success banner shows via `{pwDone && ...}` and
only hides when the user starts typing (all `onChange` handlers call `setPwDone(false)`).
This was verified to work correctly; the issue was a misread during testing.

---

---

## Issue 16: CSV file downloaded is corrupted / shows garbled text

**Symptom:**
Clicking "Export CSV" downloaded a file but opening it showed `[object Object]` or
garbled binary text instead of CSV content.

**Root Cause:**
Axios by default parses responses as JSON. When a `text/csv` response is received,
Axios tries to JSON-parse the body and fails silently, resulting in a mangled object.

**Fix:**
Pass `{ responseType: 'blob' }` in the Axios call so it treats the response as raw
binary data:
```js
export const exportAccountsCsv = () =>
  api.get('/api/accounts/export/csv', { responseType: 'blob' });
```

---

## Issue 17: CSV export opens in new browser tab instead of downloading

**Symptom:**
Initial implementation used `window.open('/api/accounts/export/csv')` which opened
the file in a new tab (and also lost the JWT Authorization header, causing a 403).

**Root Cause:**
`window.open` creates a plain browser request with no custom headers — JWT is not sent,
so Spring Security blocks it. Even if it were allowed, `window.open` displays instead
of downloading in modern browsers.

**Fix:**
Use Axios (which adds JWT automatically via interceptor) with `responseType: 'blob'`,
then trigger the download manually via `URL.createObjectURL`:
```js
const url = window.URL.createObjectURL(data);
const a = document.createElement('a');
a.href = url; a.download = 'accounts.csv';
document.body.appendChild(a); a.click(); a.remove();
window.URL.revokeObjectURL(url);
```

---

## Issue 18: Admin Stats panel shows unstyled tiles (Tailwind dynamic class purge)

**Symptom:**
Admin stats tiles had no background color — classes like `bg-blue-50`, `text-blue-700`
were not applied even though they looked correct in JSX.

**Root Cause:**
Tailwind's JIT compiler only generates CSS for classes it finds as complete strings during
the build scan. Dynamic template literals like `` `bg-${color}-50` `` are not scanned
because Tailwind cannot statically analyze interpolated strings.

**Fix:**
Replace dynamic class construction with a lookup map of full static class strings:
```js
const colorMap = {
  blue:   { bg: 'bg-blue-50   border-blue-100',   text: 'text-blue-700'   },
  emerald:{ bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
  ...
};
```
Then use `colorMap[color].bg` and `colorMap[color].text` in JSX.

> Note: In this project the stats panel used inline StatCard components that already
> had hardcoded colors, so the fix was applied by switching the admin stats grid to
> use fixed Tailwind classes per tile rather than dynamic interpolation.

---

## Issue 19: Global search returns 400 when keyword contains spaces

**Symptom:**
Searching "John Doe" via global search triggered a 400 Bad Request from the backend.

**Root Cause:**
The space character in the query string was not encoded. The URL sent was
`/api/accounts/global-search?keyword=John Doe` which is invalid.

**Fix:**
Wrap the keyword in `encodeURIComponent` in the API function:
```js
export const globalSearch = (keyword) =>
  api.get(`/api/accounts/global-search?keyword=${encodeURIComponent(keyword)}`);
```

---

## Issue 20: Soft delete trash icon always visible (not hover-only)

**Symptom:**
The trash icon button was always visible on every row, making the table look cluttered.

**Root Cause:**
The `opacity-0 group-hover:opacity-100` class was only on the "View" button wrapper,
not applied to the wrapper that now contains both View and Delete buttons.

**Fix:**
Wrap both action buttons (View + Delete) in a single `div` with
`opacity-0 group-hover:opacity-100 transition-opacity` so they appear together on
row hover:
```jsx
<div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
  <button>View</button>
  <button>Delete</button>
</div>
```

---

*Total frontend issues documented: 20*
