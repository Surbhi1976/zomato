# Bitereel: a reels-style food delivery app (MERN)

A food-discovery app with a short-video (reels) feed, inspired by food-delivery apps such as Zomato.
Customers scroll food videos, like and save them, and visit the restaurant.
Food partners upload dish videos (stored on ImageKit).

## Features
- **Reels feed:** vertical snap-scroll, only the on-screen video plays, tap to pause, mute toggle
- **Like and save** (toggle, persisted per user, live counters)
- **Comments:** bottom-sheet UI, authors can delete their own comments
- **Search:** by dish, description or restaurant name (debounced, regex-safe)
- **Food partner dashboard:** upload dish videos (ImageKit), view store page, delete own videos
- **Auth:** JWT in httpOnly cookies, separate user and partner roles, protected routes on both API and frontend
- **Sign in with Google** for customers (ID token verified on the server, accounts created or linked by verified email)
- **Forgot / reset password** for both account types (emailed single-use link, valid 30 minutes)
- **Security hardening:** see the "Security" section below
- **Store page:** partner info, dish grid, total likes
- **Saved page:** all reels a customer bookmarked

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env     # then fill in the values (see below)
npm install
npm run dev              # http://localhost:3000
```

`.env` values:

| Key | What it is |
|---|---|
| `MONGODB_URI` | e.g. `mongodb://127.0.0.1:27017/food-view` or your Atlas connection string |
| `JWT_SECRET` | any long random string |
| `CLIENT_URL` | frontend origin for CORS, default `http://localhost:5173` (comma-separate several) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID (see "Google sign-in setup") |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | email account used to send password-reset emails (see "Email setup" below) |
| `APP_NAME` | name shown in emails, default `Bitereel` |
| `IMAGEKIT_PUBLIC_KEY` / `IMAGEKIT_PRIVATE_KEY` / `IMAGEKIT_URL_ENDPOINT` | from https://imagekit.io/dashboard/developer/api-keys |

### 2. Frontend
```bash
cd frontend
cp .env.example .env     # only needed if the backend is not on http://localhost:3000
npm install
npm run dev              # http://localhost:5173
```

## Google sign-in setup
1. In Google Cloud Console create a project, then **Google Auth Platform**: fill the consent screen (Audience: External).
2. **Clients -> Create client -> Web application**. Under *Authorized JavaScript origins* add `http://localhost:5173` and `http://localhost`
   (and your live frontend URL when you deploy).
3. Put the Client ID in **both** places (it is a public value, not a secret):
   - `backend/.env`: `GOOGLE_CLIENT_ID=...`
   - `frontend/.env`: `VITE_GOOGLE_CLIENT_ID=...`
4. While the app is in *Testing* mode, add your Gmail under **Audience -> Test users**. Publish the app to allow everyone.

Notes: only customers can use Google sign-in (restaurants need a phone, address and contact person). If a customer who registered with
email + password later signs in with Google using the same email, the accounts are merged and the old password is removed, because
nobody verified that email at sign-up. They can still use Google, or "Forgot password" to set a new password.
If `VITE_GOOGLE_CLIENT_ID` is empty the Google button is simply hidden.

## Email setup (for "Forgot password")
The reset link is sent by email through any SMTP account.

**Gmail (easiest for a portfolio project)**
1. Turn on 2-Step Verification for your Google account.
2. Go to https://myaccount.google.com/apppasswords and create an App Password (16 characters).
3. In `backend/.env`:
   ```dotenv
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.address@gmail.com
   SMTP_PASS=abcdefghijklmnop      # the App Password, not your normal password
   MAIL_FROM="Bitereel <your.address@gmail.com>"
   ```
4. Restart the backend.

Other providers (Brevo, Resend SMTP, Mailgun, Outlook...) work the same way, just use their SMTP host, port and login.
Use port `465` for implicit TLS or `587` for STARTTLS.

**No SMTP yet?** Leave `SMTP_HOST` empty. The backend then prints the reset email, including the link, in the
terminal instead of sending it, so you can still try the whole flow locally.

## How to use
1. Open `/food-partner/register`, create a restaurant, then upload a dish video.
2. Open `/user/register` (in another browser or an incognito window, since both account types share one auth cookie) and scroll the feed.

## Routes

**Frontend:** `/user/login`, `/user/register`, `/food-partner/login`, `/food-partner/register`,
`/user/forgot-password`, `/food-partner/forgot-password`, `/reset-password?role=&token=`,
`/` (reels feed, users), `/saved` (users), `/create-food` (partners), `/food-partner/:id` (store page)

**API**

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/user/register` · `/login` | public |
| GET | `/api/auth/user/logout` | any |
| POST | `/api/auth/user/google` `{credential}` | public (customers only) |
| POST | `/api/auth/foodpartner/register` · `/login` | public |
| GET | `/api/auth/foodpartner/logout` | any |
| GET | `/api/auth/me` | user or partner |
| POST | `/api/auth/forgot-password` `{email, role}` | public (`role` is `user` or `partner`) |
| POST | `/api/auth/reset-password` `{token, password, role}` | public |
| GET | `/api/food?q=` | user (feed + optional search, includes `isLiked` / `isSaved`) |
| POST | `/api/food` (multipart: `name`, `description`, `video`) | partner |
| POST | `/api/food/like` `{foodId}` (toggle) | user |
| POST | `/api/food/save` `{foodId}` (toggle) | user |
| GET | `/api/food/save` | user |
| DELETE | `/api/food/:id` | partner (owner only; also removes likes, saves, comments and the ImageKit file) |
| GET | `/api/food/:id/comments` | user |
| POST | `/api/food/:id/comments` `{text}` (max 300 chars) | user |
| DELETE | `/api/food/comments/:commentId` | user (author only) |
| GET | `/api/food-partner/:id` | user or partner |

## Security
- Passwords hashed with bcrypt; minimum 8 characters enforced on the server (max 72, bcrypt's limit).
- JWT stored in an `httpOnly` cookie (not readable by JavaScript), 7-day expiry.
- **Authorization:** role checks on every protected route. Wrong role returns `403`, missing or invalid login returns `401`. Partners can only delete their own videos, users only their own comments.
- **Password reset:** the emailed token is random (256-bit), only its SHA-256 hash is stored, it expires after 30 minutes, works once,
  and the reset endpoint answers identically for unknown emails, so it cannot be used to discover which emails have accounts.
- Changing the password signs out every session created before the change.
- Emails are trimmed and lowercased, and inputs are type-checked, which blocks NoSQL-injection payloads such as `{"$gt": ""}`.
- Rate limiting per IP (15 minutes): 10 failed logins, 20 registrations, 6 reset requests, 10 reset attempts. Tunable with `RATE_LIMIT_*_MAX` env vars.
- `helmet` security headers, CORS restricted to `CLIENT_URL`, and a `no-referrer` policy so reset tokens in URLs are never leaked to other sites.

## Deploying to production
Set `NODE_ENV=production` on the backend. Cookies then use `SameSite=None; Secure`, which requires HTTPS.
Set `CLIENT_URL` to your deployed frontend URL and `VITE_API_URL` to your deployed backend URL.
