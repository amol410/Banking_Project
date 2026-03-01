# Student Bank Account Management System

A complete REST API banking system built with Spring Boot 3.2.5, JWT Authentication, MySQL, and Swagger UI.
Designed for fresher interview preparation (TCS / Infosys / Wipro).

---

## Tech Stack

| Technology | Version |
|------------|---------|
| Spring Boot | 3.2.5 |
| Java | 17 (compiled), JDK 24 compatible |
| MySQL | 8.x |
| JWT (jjwt) | 0.12.5 |
| Lombok | 1.18.38 |
| SpringDoc OpenAPI | 2.5.0 |
| iText PDF | 7.2.5 |
| OpenCSV | 5.9 |
| Bucket4j (Rate Limiting) | 8.10.1 |
| Jacoco (Test Coverage) | 0.8.13 |

---

## Setup & Run

### Prerequisites
- JDK 24 installed
- MySQL running (root / your_password)
- Maven 3.9+

### Steps
```bash
# 1. Clone the project
cd C:\Users\Admin\Desktop\Spring\Student_Management

# 2. Update DB password in application.properties
spring.datasource.password=YOUR_MYSQL_PASSWORD

# 3. Run
mvn spring-boot:run

# 4. Run Tests
mvn test

# 5. Open Swagger UI
http://localhost:8080/swagger-ui.html
```

---

---

## Version History

---

## Version 1.0 — Core Banking System

**Features:**
- JWT Authentication (Register / Login)
- Create Bank Accounts (SAVINGS / CURRENT)
- Deposit, Withdraw, Transfer
- Transaction History (paginated)
- Get Account Balance
- Global Exception Handling
- Swagger UI with Bearer Auth

### Endpoints

| Method | URL | Description | Auth Required |
|--------|-----|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login and get JWT token | No |
| POST | `/api/accounts` | Create bank account | Yes |
| GET | `/api/accounts` | Get all accounts | Yes |
| GET | `/api/accounts/{id}` | Get account by ID | Yes |
| GET | `/api/accounts/{id}/balance` | Get account balance | Yes |
| POST | `/api/accounts/{id}/deposit` | Deposit money | Yes |
| POST | `/api/accounts/{id}/withdraw` | Withdraw money | Yes |
| POST | `/api/accounts/transfer` | Transfer between accounts | Yes |
| GET | `/api/accounts/{id}/transactions` | Transaction history (paginated) | Yes |

### Test in Postman

**1. Register**
```
POST http://localhost:8080/auth/register
Body:
{
  "username": "admin1",
  "password": "password123",
  "email": "admin@bank.com",
  "role": "ADMIN"
}
```

**2. Login**
```
POST http://localhost:8080/auth/login
Body:
{
  "username": "admin1",
  "password": "password123"
}
Response: Copy the "token" value
```

**3. Create Account** *(Authorization: Bearer <token>)*
```
POST http://localhost:8080/api/accounts
Body:
{
  "accountHolderName": "John Doe",
  "accountType": "SAVINGS"
}
Response: Note the "accountId"
```

**4. Deposit** *(Authorization: Bearer <token>)*
```
POST http://localhost:8080/api/accounts/1/deposit
Body:
{
  "amount": 5000.00,
  "description": "Initial deposit"
}
```

**5. Withdraw** *(Authorization: Bearer <token>)*
```
POST http://localhost:8080/api/accounts/1/withdraw
Body:
{
  "amount": 1000.00,
  "description": "ATM withdrawal"
}
```

**6. Transfer** *(Authorization: Bearer <token>)*
```
POST http://localhost:8080/api/accounts/transfer
Body:
{
  "fromAccountId": 1,
  "toAccountId": 2,
  "amount": 500.00,
  "description": "Rent payment"
}
```

**7. Get Balance** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/accounts/1/balance
```

**8. Transaction History** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/accounts/1/transactions
```

---

---

## Version 2.0 — Account Management Features

**New Features added over v1.0:**
- Close / Deactivate Account
- Update Account Holder Name
- Get Account by Account Number
- Search Accounts by Holder Name
- Mini Statement (last 5 transactions)

### New Endpoints

| Method | URL | Description | Auth Required |
|--------|-----|-------------|---------------|
| PUT | `/api/accounts/{id}/close` | Close/deactivate account | Yes |
| PUT | `/api/accounts/{id}/update-name` | Update account holder name | Yes |
| GET | `/api/accounts/number/{accountNumber}` | Get account by account number | Yes |
| GET | `/api/accounts/search?name=John` | Search accounts by name | Yes |
| GET | `/api/accounts/{id}/mini-statement` | Last 5 transactions | Yes |

### Test in Postman

**1. Close Account** *(Authorization: Bearer <token>)*
```
PUT http://localhost:8080/api/accounts/1/close
No body needed
Expected: status becomes "INACTIVE"
```

**2. Update Account Name** *(Authorization: Bearer <token>)*
```
PUT http://localhost:8080/api/accounts/1/update-name
Body:
{
  "accountHolderName": "John Smith"
}
```

**3. Get by Account Number** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/accounts/number/ACC8A19BCBF
```

**4. Search by Name** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/accounts/search?name=John
```

**5. Mini Statement** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/accounts/1/mini-statement
Expected: Last 5 transactions in descending order
```

---

---

## Version 3.0 — Business Logic Features

**New Features added over v2.0:**
- Date Filter on Transactions
- Change Password
- User Profile
- Daily Withdrawal Limit (Rs. 10,000/day)
- Interest Calculation (4% p.a. for SAVINGS)

### New Endpoints

| Method | URL | Description | Auth Required |
|--------|-----|-------------|---------------|
| GET | `/api/accounts/{id}/transactions/filter?startDate=&endDate=` | Filter transactions by date | Yes |
| PUT | `/api/users/change-password` | Change user password | Yes |
| GET | `/api/users/profile` | Get logged-in user profile | Yes |
| GET | `/api/accounts/{id}/interest` | Calculate interest for account | Yes |

### Test in Postman

**1. Date Filter** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/accounts/1/transactions/filter?startDate=2026-01-01&endDate=2026-12-31
```

**2. Change Password** *(Authorization: Bearer <token>)*
```
PUT http://localhost:8080/api/users/change-password
Body:
{
  "currentPassword": "password123",
  "newPassword": "newpass456"
}
```

**3. User Profile** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/users/profile
Expected: { "userId", "username", "email", "role" }
```

**4. Interest Calculation** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/accounts/1/interest
Expected:
{
  "currentBalance": 3500.00,
  "annualInterestRate": "4%",
  "monthlyInterest": 11.67,
  "yearlyInterest": 140.00,
  "balanceAfterOneYear": 3640.00
}
```

**5. Daily Limit Test** *(Authorization: Bearer <token>)*
```
POST http://localhost:8080/api/accounts/1/withdraw
Body: { "amount": 15000.00, "description": "Test" }
Expected: 400 - "Daily withdrawal limit of 10000.00 exceeded"
```

---

---

## Version 4.0 — Advanced Features

**New Features added over v3.0:**
- Email Notifications (deposit, withdraw, transfer, welcome)
- PDF Account Statement Download
- Audit Logs (track all user actions)
- Refresh Token (auto-renew JWT without re-login)
- Logout (invalidate refresh token)
- Scheduled Monthly Interest Job (runs 1st of every month)
- Manual Interest Trigger (admin)

### New Endpoints

| Method | URL | Description | Auth Required |
|--------|-----|-------------|---------------|
| POST | `/auth/refresh-token` | Get new access token using refresh token | No |
| POST | `/auth/logout` | Logout and invalidate refresh token | Yes |
| GET | `/api/accounts/{id}/statement/pdf` | Download PDF statement | Yes |
| GET | `/api/audit-logs` | Get all audit logs | Yes |
| GET | `/api/audit-logs/user/{username}` | Get audit logs by user | Yes |
| POST | `/api/admin/trigger-interest` | Manually trigger interest job | Yes |

### Test in Postman

**1. Register (now returns refreshToken too)**
```
POST http://localhost:8080/auth/register
Response now includes:
{
  "token": "eyJ...",
  "refreshToken": "uuid-string",
  "username": "...",
  "role": "..."
}
```

**2. Refresh Token**
```
POST http://localhost:8080/auth/refresh-token
Body:
{
  "refreshToken": "your-refresh-token-uuid"
}
Expected: New access token + new refresh token
```

**3. Logout** *(Authorization: Bearer <token>)*
```
POST http://localhost:8080/auth/logout
Expected: { "message": "Logged out successfully" }
```

**4. Download PDF Statement** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/accounts/1/statement/pdf
In Postman: Click "Send and Download" to save as PDF
```

**5. Get All Audit Logs** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/audit-logs
Expected: Paginated list of all actions (login, register, etc.)
```

**6. Get Audit Logs by User** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/audit-logs/user/admin1
```

**7. Trigger Interest Manually** *(Authorization: Bearer <token>)*
```
POST http://localhost:8080/api/admin/trigger-interest
Expected: { "message": "Monthly interest applied successfully" }
Note: Adds interest to all active SAVINGS accounts automatically
```

---

---

## Version 5.0 — Search, Export, Soft Delete & Rate Limiting

**New Features added over v4.0:**
- Global Search (search by name or account number in one query)
- Export to CSV (all accounts or account-specific transactions)
- Soft Delete (mark account as deleted without removing from DB)
- Admin Dashboard Stats (total accounts, balances, active/inactive counts)
- Rate Limiting (60 requests per minute per IP — returns 429 if exceeded)

### New Endpoints

| Method | URL | Description | Auth Required |
|--------|-----|-------------|---------------|
| GET | `/api/accounts/global-search?keyword=` | Search by name or account number | Yes |
| DELETE | `/api/accounts/{id}` | Soft delete an account | Yes |
| GET | `/api/accounts/export/csv` | Export all accounts as CSV | Yes |
| GET | `/api/accounts/{id}/transactions/export/csv` | Export transactions as CSV | Yes |
| GET | `/api/admin/dashboard` | Admin dashboard statistics | Yes |

### Test in Postman

**1. Global Search** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/accounts/global-search?keyword=John
GET http://localhost:8080/api/accounts/global-search?keyword=ACC8A19
Expected: List of accounts matching name or account number
```

**2. Soft Delete Account** *(Authorization: Bearer <token>)*
```
DELETE http://localhost:8080/api/accounts/1
Expected:
{
  "message": "Account soft deleted successfully",
  "accountId": "1",
  "deletedAt": "2026-03-02T..."
}
Note: Account remains in DB, status becomes INACTIVE, deleted=true
```

**3. Export All Accounts to CSV** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/accounts/export/csv
In Postman: Click "Send and Download" — saves as accounts.csv
Columns: Account ID, Account Number, Holder Name, Account Type, Balance, Status, Created At
```

**4. Export Transactions to CSV** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/accounts/1/transactions/export/csv
In Postman: Click "Send and Download" — saves as transactions_account_1.csv
Columns: Transaction ID, Type, Amount, From Account, To Account, Description, Timestamp
```

**5. Admin Dashboard** *(Authorization: Bearer <token>)*
```
GET http://localhost:8080/api/admin/dashboard
Expected:
{
  "totalAccounts": 5,
  "activeAccounts": 4,
  "inactiveAccounts": 1,
  "totalBalanceAcrossAllAccounts": 25000.00,
  "generatedAt": "2026-03-02T..."
}
```

**6. Rate Limiting Test**
```
Send more than 60 requests in 1 minute from the same IP.
Expected response on 61st request:
HTTP 429 Too Many Requests
{
  "status": 429,
  "message": "Too many requests. Limit: 60 requests per minute."
}
Response headers include:
  X-Rate-Limit-Limit: 60
  X-Rate-Limit-Remaining: <remaining count>
```

---

## Email Notifications Setup

Email notifications are **disabled by default**. To enable them, edit the file:

```
src/main/resources/application.properties
```

Change/add the following lines:

```properties
# Enable email notifications
app.mail.enabled=true

# Gmail SMTP settings
spring.mail.username=your_gmail@gmail.com
spring.mail.password=your_app_password
```

**Steps to get Gmail App Password:**
1. Go to your Google Account → Security
2. Enable 2-Step Verification (required)
3. Go to Security → App passwords
4. Create a new app password for "Mail"
5. Copy the 16-character password and paste it as `spring.mail.password`

**Note:** Use App Password, NOT your regular Gmail password. App passwords work even with 2FA enabled.

---

## Error Responses

All errors follow this format:
```json
{
  "timestamp": "2026-03-02T...",
  "status": 400,
  "message": "Error description",
  "fieldErrors": { "field": "error message" }
}
```

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation / business logic error) |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (no token provided) |
| 404 | Account / Resource not found |
| 500 | Internal Server Error |

---

## Business Rules

| Rule | Details |
|------|---------|
| Account Number | Auto-generated: `ACC` + 8 random chars (e.g. `ACC8A19BCBF`) |
| Initial Balance | Always Rs. 0 on account creation |
| Minimum Transaction | Rs. 0.01 |
| Daily Withdrawal Limit | Rs. 10,000 per account per day |
| Interest Rate | 4% per annum on SAVINGS accounts |
| Interest Schedule | Auto-credited on 1st of every month |
| Transfer | Atomic transaction — full rollback on failure |
| JWT Expiry | 24 hours |
| Refresh Token Expiry | 7 days |
| Inactive Account | Cannot deposit, withdraw or transfer |

---

## Database Tables

| Table | Description |
|-------|-------------|
| `users` | Registered users with roles |
| `bank_accounts` | All bank accounts |
| `transactions` | All deposit/withdraw/transfer records |
| `audit_logs` | System activity logs |
| `refresh_tokens` | Active refresh tokens per user |

---

## Running Tests

```bash
mvn test
```
- 45 unit and integration tests (15 AccountServiceTest + 8 AuthServiceTest + 12 AccountControllerTest + 10 AuthControllerTest)
- All tests pass with BUILD SUCCESS
- Jacoco coverage report at: `target/site/jacoco/index.html`
- Minimum coverage threshold: 70% line coverage
