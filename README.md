# BloodConnect – Emergency Blood Donor Platform

A MERN-stack web app that connects people who urgently need blood with available donors and hospitals.

> ## ⚠️ Testing status – please read first
> This project was generated in an environment **without internet access**, so `npm install` could not run and the app was **never started or tested end-to-end**, and it was **never connected to a real MongoDB Atlas database**.
> What *was* verified: every backend `.js` file passes a Node syntax check (`node --check`), every frontend `.jsx` file parses without syntax errors, and all relative imports/exports were cross-checked by script.
> What was **not** verified: installing packages, `vite build`, running the server, any API call, the seed script against a real database, the browser UI.
> Expect that you may need to fix a few small bugs on first run. Work through the **Testing checklist** below and treat anything that fails as a bug to fix.

---

## 1. Features

**Public:** landing page with live counts, blood-group quick links, donor search (blood group, city, availability, "near me"), About / How it works / Contact, responsive navbar + footer, loading / empty / error states, toast messages.

**Donor:** register, login, profile, Available/Unavailable switch, dashboard, see requests sent to them (emergency first), accept / decline (one response per request), history.

**Requester (patient/family) & Hospital:** register, login, create request (patient, blood group, units, hospital, location, contact, needed-by date, priority, notes), auto-notify matching donors, send the request to extra donors, track status on a timeline, see donor responses, cancel / complete / delete.

**Admin:** dashboard cards (users, donors, available donors, requests, pending, completed, emergency, average response time), charts (requests per day, by blood group, donors by group, by urgency), recent emergency requests, manage users (search, filter, activate/deactivate, delete), manage all requests (filter, change status, delete).

**Advanced:** nearest-donor matching (Haversine) with city fallback, emergency/critical priority sorting and highlighting, in-app notifications, response-time analytics.

## 2. Technology stack
React 18 + Vite · Bootstrap 5 + custom CSS · React Router 6 · Axios · lucide-react icons · react-hot-toast · Node.js + Express 4 · MongoDB Atlas + Mongoose 8 · JWT (`jsonwebtoken`) · password hashing with `bcryptjs` · `dotenv`, `cors`, `express-rate-limit`.

> `bcryptjs` is used instead of `bcrypt` because it is the same algorithm in pure JavaScript and installs on Windows without C++ build tools.

## 3. Folder structure
```
BloodConnect/
├── README.md
├── docs/PROJECT_GUIDE.md        (architecture, schema, viva, syllabus mapping)
├── backend/
│   ├── package.json  .env.example
│   └── src/
│       ├── server.js  app.js
│       ├── config/db.js
│       ├── models/        User.js  BloodRequest.js  Notification.js
│       ├── controllers/   auth, donors, requests, notifications, admin
│       ├── routes/        auth, donors, requests, notifications, admin
│       ├── middleware/    auth.js (JWT + roles)  error.js
│       ├── utils/         helpers (Haversine…)  matching  notify  profile
│       └── seed/          seed.js  createAdmin.js
└── frontend/
    ├── package.json  .env.example  vite.config.js  vercel.json  index.html
    └── src/
        ├── main.jsx  App.jsx  index.css
        ├── context/AuthContext.jsx
        ├── services/api.js
        ├── components/    Navbar Footer ProtectedRoute ui
        ├── layouts/       PublicLayout DashboardLayout
        ├── pages/         Landing About Login Register DonorSearch DashboardHome
        │                  Requests RequestForm RequestDetail AdminUsers Notifications Profile NotFound
        └── utils/constants.js
```

## 4. Prerequisites
* Node.js 18 or newer (https://nodejs.org – choose LTS) and npm
* VS Code
* A free MongoDB Atlas account (https://www.mongodb.com/atlas)
* Git (for GitHub / deployment)

## 5. Configure MongoDB Atlas
1. Create a free **M0** cluster.
2. **Database Access → Add New Database User** – choose a username and password (avoid `@ : / ?` in the password).
3. **Network Access → Add IP Address** – for local testing choose *Allow access from anywhere* (`0.0.0.0/0`). Needed for Render too.
4. **Database → Connect → Drivers** – copy the connection string. It looks like `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/`.
5. Put your password in it and add the database name before the `?`, e.g. `...mongodb.net/bloodconnect?retryWrites=true&w=majority`.

## 6. Environment variables
Never commit `.env` files.

**backend/.env** (copy from `.env.example`)
| Name | Meaning |
|---|---|
| `PORT` | API port (5000) |
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | long random string |
| `JWT_EXPIRES_IN` | token lifetime, e.g. `7d` |
| `CLIENT_URL` | frontend origin(s) allowed by CORS, comma-separated |
| `ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD` | used only by `npm run create-admin` |

**frontend/.env** (copy from `.env.example`): `VITE_API_URL=http://localhost:5000/api`

## 7. Install and run (VS Code on Windows)
Extract the ZIP, open the `BloodConnect` folder in VS Code, open **two terminals** (Terminal → New Terminal).

**Terminal 1 – backend**
```bat
cd backend
copy .env.example .env
notepad .env
npm install
npm run create-admin
npm run seed
npm run dev
```
Edit `.env` in Notepad (set `MONGO_URI`, `JWT_SECRET`, `ADMIN_PASSWORD`) before running the next commands. You should see `MongoDB connected` and `BloodConnect API running on port 5000`. Check http://localhost:5000/api/health.

**Terminal 2 – frontend**
```bat
cd frontend
copy .env.example .env
npm install
npm run dev
```
Open http://localhost:5173.

## 8. Demo data and accounts
* `npm run seed` inserts ~70 donors, 12 requesters, 10 hospitals, 60 requests and a few hundred notifications (well over 100 records in total) (all fictional). Running it again removes the previous seeded data (emails ending `@bloodconnect.demo`, never admins) and inserts fresh data. It is **never run automatically**.
* All seeded users share the password **`Demo@1234`**. The seed prints one donor and one requester email at the end.
* **Admin:** `npm run create-admin` creates (or upgrades) the account defined by `ADMIN_EMAIL` / `ADMIN_PASSWORD` in your `.env`. The example email is `admin@bloodconnect.demo`; choose your own password. Admins cannot be created through the public registration form.
* Use these accounts for local demos only.

## 9. API reference
Base URL: `/api`. 🔒 = needs `Authorization: Bearer <token>`.

| Method | Endpoint | Who | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Register donor / requester / hospital |
| POST | `/auth/login` | public | Login → `{token, user}` |
| GET | `/auth/me` 🔒 | any | Current user |
| PUT | `/auth/me` 🔒 | any | Update own profile / availability |
| GET | `/stats/public` | public | Landing page counts |
| GET | `/donors`, `/donors/search` | public | Search: `bloodGroup, city, available=true\|all, lat, lng` (no contact details) |
| GET | `/donors/:id` 🔒 | any | Donor public profile (contact only for admin) |
| PUT | `/donors/:id` 🔒 | self / admin | Update donor |
| DELETE | `/donors/:id` 🔒 | self / admin | Delete donor |
| POST | `/requests` 🔒 | requester, hospital | Create request (auto-notifies matching donors) |
| GET | `/requests` 🔒 | any | Role-based list: own / sent-to-me / all. Filters `status, urgency, q` |
| GET | `/requests/:id` 🔒 | owner, matched donor, admin | Details (privacy rules applied) |
| PUT | `/requests/:id/status` 🔒 | owner, admin | Change status (valid transitions only) |
| POST | `/requests/:id/respond` 🔒 | donor | `{response: "accepted"\|"declined"}` – once per donor |
| POST | `/requests/:id/send/:donorId` 🔒 | owner | Send request to another donor |
| DELETE | `/requests/:id` 🔒 | owner (pending/cancelled), admin | Delete |
| GET | `/notifications` 🔒 | any | Latest 50 |
| GET | `/notifications/unread-count` 🔒 | any | Badge count |
| PUT | `/notifications/read-all`, `/notifications/:id/read` 🔒 | any | Mark read |
| GET | `/admin/dashboard` (alias `/admin/analytics`) 🔒 | admin | Totals, averages, chart data |
| GET | `/admin/users` 🔒 | admin | `q, role, active` filters |
| PATCH | `/admin/users/:id/active` 🔒 | admin | Activate / deactivate |
| DELETE | `/admin/users/:id` 🔒 | admin | Delete user and related data |

**Status rules:** `pending → accepted | cancelled`, `accepted → completed | cancelled`. `completed` and `cancelled` are final. Only a donor accepting a request (or an admin) can set `accepted`.

## 10. Testing checklist
Do these in order and tick them off. Report/fix anything that fails.
- [ ] Backend starts, `/api/health` returns `{status:"ok"}`
- [ ] `npm run create-admin` and `npm run seed` complete without errors
- [ ] Register a donor (fails with clear messages on bad input; duplicate email rejected)
- [ ] Log in / log out; refresh the page keeps you logged in
- [ ] Donor toggles Available → search page shows / hides them
- [ ] Search by blood group + city; "Near me" sorts by distance; no phone/email is shown
- [ ] Register a requester; create a request → toast says how many donors were notified
- [ ] Log in as a matching donor → notification bell shows a count; request appears in "Blood requests"
- [ ] Donor accepts → status becomes *accepted*; requester sees donor contact details and a notification
- [ ] Same donor cannot respond twice; another donor cannot accept after it is accepted
- [ ] Requester marks completed; cancelled/completed requests cannot change again
- [ ] Emergency / critical requests are highlighted and listed first
- [ ] Hospital account can create and track requests
- [ ] Admin: dashboard numbers and charts, user search/filter, deactivate a user (they can no longer log in), change a request status, delete a request
- [ ] Unauthorized checks: opening `/dashboard/users` as a donor redirects; calling `GET /api/admin/users` without admin token returns 401/403; editing someone else's request returns 403

## 11. Troubleshooting
| Problem | Fix |
|---|---|
| `MONGO_URI is missing` | Create `backend/.env` from `.env.example` |
| `MongooseServerSelectionError` | Atlas Network Access must allow your IP (or `0.0.0.0/0`); check username/password in the URI |
| `bad auth` | Wrong DB user/password; special characters in password must be URL-encoded |
| Browser shows *Cannot reach the server* | Backend not running, or `VITE_API_URL` is wrong. Restart `npm run dev` after editing `.env` |
| CORS error | Add the frontend URL to `CLIENT_URL` in the backend env (no trailing slash) and restart |
| `Too many attempts` | Auth rate limit (50 per 15 min per IP) – wait or restart the server |
| Port already in use | Change `PORT` or stop the other process |
| Blank page after Vercel deploy | Make sure `VITE_API_URL` is set in Vercel and `vercel.json` exists (SPA rewrites) |

## 12. Deployment
**GitHub:** create an empty repo, then in the project root
```bat
git init
git add .
git commit -m "BloodConnect mini project"
git branch -M main
git remote add origin https://github.com/<your-username>/bloodconnect.git
git push -u origin main
```
(`.gitignore` already excludes `node_modules` and `.env`.)

**Backend → Render:** New → Web Service → connect the repo. Root directory `backend`, build `npm install`, start `npm start`. Add environment variables `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`, `CLIENT_URL=https://<your-vercel-app>.vercel.app`. Free instances sleep when idle, so the first request can take ~50 seconds.

**Frontend → Vercel:** Import the repo, set Root Directory to `frontend`, framework *Vite*. Add env var `VITE_API_URL=https://<your-render-service>.onrender.com/api`. Deploy, then put the Vercel URL into Render's `CLIENT_URL` and redeploy the backend.

**Admin and seed on production:** run `npm run create-admin` locally with `MONGO_URI` pointing at the Atlas database (same database Render uses).

## 13. Known limitations
* **Untested** – see the notice at the top.
* **Notifications are in-app and polled** (the bell refreshes every 30 s and when pages load). Socket.IO real-time push was intentionally left out to keep deployment on free tiers simple and reliable.
* Charts are lightweight CSS bar charts (no chart library).
* Donor matching uses exact blood-group match only; it does not model blood compatibility (e.g. O- can donate to many groups). Compatibility and eligibility **must be verified by medical professionals**.
* Coordinates come from the browser's location button; there is no address geocoding. Without coordinates matching falls back to city text.
* No email/SMS delivery, password reset, or image upload.
* The user list and request list are capped at 300 records without pagination.
