# SubTrack — Smart Subscription & Billing Management Platform

A multi-tenant SaaS platform for subscription-based local businesses (gyms, clinics,
coaching institutes, salons, academies, etc.) to replace Excel-based customer and
billing management with a real, role-based web application.

## Project Structure:

```
subscription-platform/
├── backend/          Node.js + Express + MongoDB REST API
├── frontend/          React + Vite + Tailwind SPA
├── docker-compose.yml Runs mongo + backend + frontend together
└── README.md          
```

## Output:
<img width="1917" height="986" alt="Screenshot 2026-11-01 114019" src="https://github.com/user-attachments/assets/00a18f2b-63c4-46ac-8b37-848c4e9a37fe" />


---

## Quick start 

**Requirements:** Node.js 18+, MongoDB running locally (or an Atlas connection string).

```bash
# 1. Backend
cd backend
cp .env.example .env      # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed               # creates a demo business + plans
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 
```

If you ran `npm run seed`, log in at 

## Quick start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000/api
- MongoDB: localhost:27017 (persisted in a named volume)

Set a real `JWT_SECRET` before deploying anywhere real:
```bash
JWT_SECRET=$(openssl rand -hex 32) docker compose up --build
```

## Project Features 

- **Customer Management**: full CRUD — Edit, Delete (soft delete, blocked while an
  active subscription exists), View, search/filter, and confirm dialogs + toasts on
  every action.
- **Routing**: every module now has a dedicated route, including a new **Notifications**
  page (`/app/notifications`) and a renamed **Billing** module (`/app/billing`, was
  "Invoices"). Breadcrumbs (`components/layout/Breadcrumbs.jsx`) now appear on every
  page, and active-route highlighting was already in place via `NavLink`.
- ~~**HeroUI**~~ — initially added, then removed in Update 9 below after it turned out
  to be a likely cause of the whole app failing to build. See that section for why.
- **Business branding**: business login/register now returns full branding data
  (logo, type, address) to every role, including customers. The top header shows the
  logo + name + type on every page for every role, and both the owner Dashboard and
  customer Portal Dashboard now open with a branded banner.
- **Professional invoice PDFs**: `backend/utils/invoicePdf.js` (built on `pdfkit`)
  generates a real, downloadable/printable PDF — logo, business address, invoice
  number, customer name/ID, plan, payment date/method, amount, transaction status, a
  "PAID" stamp, and a signature block. Recording a payment auto-resolves its pending
  invoice and immediately offers a "Download Invoice PDF" action; the same PDF is also
  downloadable from the Billing page, the Payments history, and the customer portal.



**Multi-tenancy.** Every business-scoped document (`Customer`, `Subscription`,
`Payment`, `Invoice`, `Staff`, `SubscriptionPlan`, `AuditLog`, `Settings`) carries a
`business` field. `middleware/auth.js` resolves `req.tenantBusinessId` from the JWT on
every request, and every controller query filters by it — a request body/query
parameter can never be used to reach another business's data.

**Roles.** Owner / Manager / Receptionist / Customer, enforced via
`middleware/roleCheck.js` on every route (see `routes/*.js` for exactly which roles can
hit which endpoint).

**IDs.** `BUS-<TYPE>-#####` and `CUS-<YEAR>-#####` are generated server-side
(`utils/idGenerator.js`), checked for uniqueness, and stored as `immutable` in the
schema — they can never be edited after creation, matching the spec.

**Subscription lifecycle.** Create / renew / upgrade / cancel are separate actions in
`controllers/subscriptionController.js`. Renew and upgrade don't mutate the existing
subscription — they close it out and create a new one linked via `previousSubscription`,
so the full history stays intact. Each create/renew/upgrade auto-generates an `Invoice`.

**Soft delete.** Staff are never hard-deleted (`isActive: false` + `deactivatedAt`) so
historical payments/invoices that reference them stay valid, per the spec. Account
deletion for customers/staff anonymizes the email (so it can't be reused) rather than
removing the document, for the same reason. Owners can't self-delete while their
business is active — there'd be nothing left to attach the business's data to.

**Status transitions.** `jobs/subscriptionStatusJob.js` sweeps subscriptions hourly
(active → expiring_soon → expired, using each business's configurable threshold in
`Settings`) and keeps the customer's denormalized `subscriptionStatus` in sync. In
production, swap the in-process `setInterval` in `server.js` for a real cron job or
scheduled Lambda so it survives restarts and doesn't double-run across replicas.

## — partial payments, custom dates, customer notifications, mobile polish

- **Partial payments (core billing fix)**: an invoice now tracks `amount`, `amountPaid`
  and `balanceDue`, with status `pending` → `partial` → `paid`. Paying less than the
  full plan price (e.g. ₹700 of a ₹1300 plan) leaves the invoice "partial" with a ₹600
  balance; a later payment against the same invoice settles it. `recordPayment`
  validates you can never pay more than the outstanding balance. The customer list,
  customer detail page, Billing, Payments, the owner Dashboard's "Pending Payments"
  stat, and the customer's own portal all read from this one source of truth, so a
  single payment updates everything automatically.
- **Invoice PDF reflects partial payments accurately**: shows Plan Amount, Amount
  Paid, Balance Due, a full payment transaction history (every partial payment
  listed with date/method/amount), and stamps the PDF "PAID IN FULL",
  "PARTIALLY PAID", or "UNPAID" accordingly.
- **Customizable join/end dates**: starting a subscription now has an optional
  "Customize join date & end date" toggle — otherwise it auto-calculates from today +
  the plan's billing cycle, same as before.
- **Customer-side notifications**: customers now have their own Notifications page
  (`/portal/notifications`), separate from the business's notification feed.
- **Profile quick-view dropdown**: clicking the avatar/name in the top header (both
  business and customer sides) opens a dropdown with a profile snapshot, a
  "View My Profile" link, and logout.
- **Mobile/tablet responsiveness**: the sidebar hamburger drawer contains every nav
  item for the signed-in role on both business and customer sides; tightened
  header/sidebar spacing and touch targets for narrow screens.
- **More color/motion**: added Tailwind keyframes (float, glow-pulse, shimmer,
  pop-in), a gradient "SubTrack" wordmark, and hover animations on stat cards.

##  — Role-Based Access Control (RBAC)

Every backend route and frontend page/button is now gated by a single permission
matrix rather than scattered role checks, so Owner/Manager/Receptionist access
exactly matches the spec on both sides:

- **`backend/config/permissions.js`** is the one source of truth: a map of
  permission name → allowed roles (e.g. `CUSTOMER_DELETE: ['owner']`). To change
  who can do something, edit this one file — nothing else.
- **`backend/middleware/permissions.js`** exports `requirePermission('NAME')`,
  used on every business route after `protect` + `businessUserOnly`. A logged-in
  user whose role isn't listed for that permission gets a real `403 Forbidden`
  with a clear message — never a silent failure or a 401.
- **Login/register/`/api/auth/me`** now return a `permissions: [...]` array
  on the user object (via `getPermissionsForRole`), computed server-side from
  the same matrix. The frontend never guesses what a role can do from the role
  name alone — it reads this array.
- **Frontend**: `src/utils/permissions.js` mirrors the permission *names* (not
  the logic) and exposes `hasPermission(user, PERMISSIONS.X)`. `ProtectedRoute`
  checks it before a page ever mounts; `DashboardShell`'s sidebar nav is one
  flat list of `{ to, label, permission }` filtered by the user's own
  `permissions`, so an unlisted permission automatically hides the menu item
  everywhere, in one place. Buttons that only some roles should see (Edit/Delete
  customer, Start Subscription, Upgrade, Cancel) are individually wrapped in
  `hasPermission(...)` checks on the Customers and Customer Detail pages.
- **Enforced exactly per the spec**: Receptionist can register/view customers,
  renew/record payments, and use the Notification Center, but cannot edit or
  delete a customer, cannot create new subscriptions (only renew), cannot
  upgrade/cancel, and cannot see Plans, Staff, Settings, the Billing ledger, or
  Reports. Manager gets all of that plus edit customers, create/upgrade/cancel
  subscriptions, Reports, and Billing — but not Plans, Staff, Settings,
  deleting a customer, or deleting the business. Owner has everything.
  (Note: an earlier update had restricted the Notification Center to Owner +
  Manager only; the subsequent notification-system spec explicitly asked for
  Receptionist to have it too, so `NOTIFICATIONS_VIEW` now includes all three
  business roles — this is the kind of change the single permissions.js file
  is designed to make painless.)
- Every one of the above is enforced **twice** — once by the frontend (hiding
  the menu/button, redirecting away from the page) and independently by the
  backend (the API call itself 403s) — per the "validate on both frontend and
  backend" requirement. Hiding a button is a UX courtesy, never the actual
  security boundary.

##  real-time notification system & typography pass

- **Real-time push, not polling**: `backend/utils/socket.js` + `server.js` wrap
  the Express app in a plain `http.Server` and attach Socket.io to the same
  port. Every socket connection authenticates with the same JWT used for REST
  calls (`io.use` verifies it and rejects anything else), then joins a
  `business:<id>` room (so the whole Notification Center updates live for
  every signed-in Owner/Manager/Receptionist at once) and a personal
  `user:<id>` room (what the customer portal listens on). `notificationEvents.js`
  has one function per business event — customer registered, subscription
  activated/renewed/upgraded/expiring/expired, payment received/failed,
  invoice generated, plan created/updated, staff added/deactivated, customer
  deleted/updated — each writes a `Notification` document *and* emits it over
  the socket in the same call, so REST history and the live feed can never
  drift out of sync.
- **Frontend**: `NotificationContext` owns one socket connection per session,
  merges live pushes with the REST-loaded history, and exposes
  `unreadCount`/`markRead`/`markAllRead`/`remove` to both the navbar bell and
  the full Notification Center pages so they're always showing the same state.
  `NotificationBell` (in the top nav, both business and customer sides) shows
  the unread badge, a connection indicator, and a dropdown preview of the
  latest 6 with "View all." Both full pages add category icons/colors per
  event type (`utils/notificationMeta.js`), an unread-only filter, delete,
  and an empty state.
- **"Payment failed" is a real, recordable event**, not a simulated random
  failure: the payment form can log a failed attempt (declined card, bounced
  UPI, etc.) as its own transaction with `status: 'failed'` — it never touches
  the invoice balance — and fires the `payment_failed` notification.
- **Customer vs. business wording**: event messages are written once, in
  third person ("Harish M's profile information has been updated."), which
  reads correctly in the shared business feed. On a customer's own portal,
  `personalizeForCustomer()` does a light client-side substitution of the
  common "`<name>'s ...`" prefix to "Your ..." to match the spec's
  customer-facing phrasing, without needing two copies of every message
  stored server-side.
- **Typography/UI**: kept the existing Manrope (body) + Sora (headings) pairing
  — already a modern, professional combination — but tightened the shared
  type scale in `index.css` (heading tracking/line-height, tabular numerals
  for stat cards and tables so digits don't jitter, a visible on-brand
  keyboard focus ring, smooth scrolling) plus a few new shared classes
  (`.page-title`, `.page-subtitle`, `.section-title`, `.text-subtle`) for
  consistency. This was a deliberate scope decision: refining the shared
  CSS/typography primitives touches every page automatically and safely;
  hand-editing every individual page's markup for a cosmetic pass would be a
  much larger, riskier diff to make without a live browser to verify against.

**Socket.io in particular needs a live client+server pair to verify** — I
can't spin up a browser against a running Node process in this environment,
so the plumbing (JWT handshake auth, room joins, emit-on-write) is correct by
code review but not something I've watched actually fire in a browser tab.
When you run it locally: open two browser windows signed in as different
staff (or staff + a customer), trigger an event in one (e.g. record a
payment), and confirm the bell badge updates in the other without a refresh.
If you deploy behind a reverse proxy other than the included nginx config,
make sure it forwards the `Upgrade`/`Connection` headers for `/socket.io/` —
Socket.io falls back to HTTP long-polling otherwise, which still works but
isn't true push.

## visual redesign 

Restyled to match a supplied fintech-dashboard reference (soft rounded cards,
pastel icon-circle stat cards, pill-shaped segmented tabs, a left-accent-bar
sidebar, a 3-step progress tracker, a floating quick-help button) while
keeping the same stack (React, Tailwind, React Router, Context-based
state) and the same functionality throughout.

- **Design tokens** (`tailwind.config.js`, `index.css`): refreshed the brand
  blue, added a `pastel.*` palette for icon-circle badges, a `canvas`
  page-background color, and larger `xl3` card radius.
- **New shared components** — because the whole app is built from a handful
  of shared primitives, redesigning these propagates the new look to every
  page automatically, not just the ones listed below:
  - `components/ui/SegmentedTabs.jsx` — the pill-shaped tab row.
  - `components/ui/StepIndicator.jsx` — the 3-step progress tracker.
  - `StatCard`/new `MiniInfoCard` in `components/ui/UI.jsx` — pastel
    icon-circle stat cards (this alone restyles the Dashboard, Reports, and
    customer Portal Dashboard with zero changes to those files).
- **`DashboardShell`** (sidebar + top bar, used by literally every page):
  active nav items now get a light-blue fill + left accent bar, admin-only
  items sit under a small "Admin" section label, the top bar gained a working
  quick customer-search box (`Customers.jsx` reads `?q=` on load), and a
  floating round button bottom-right opens a small `QuickHelp` popover
  (kept honest — real support links, not a simulated AI chat the app doesn't have).
- **Two pages rebuilt closely against the reference**: `CustomerDetail.jsx`'s
  subscription panel now uses `MiniInfoCard`s for Plan Amount/Amount
  Paid/Balance Due and a `StepIndicator` in the "Start Subscription" flow;
  `Plans.jsx`'s cards now use the illustrated-panel + checklist layout; and
  `BusinessSettings.jsx` switched from two side-by-side cards to
  `SegmentedTabs`.

**Scope note, stated plainly**: a literal page-by-page pixel match across all
~30 pages in one pass isn't something I can responsibly claim after a single
reference-image comparison with no live browser to check against. The
approach here — rebuild the shared design system once so it propagates
everywhere, then closely rebuild the two pages that map directly onto the
reference screenshots — gets the whole app looking consistent and modern
rather than two polished pages and 28 unchanged ones. If there's a specific
page you want pushed further to match the reference, point me at it and I'll
go deeper on that one.

#instead of the previous amber/orange.

 



## What's intentionally stubbed 

This was built in an environment with no network access, so nothing here was actually
run against a live database or deployed — everything below is written correctly and
ready to go, but hasn't been exercised end-to-end. Before relying on it:

- **Run `npm install` in both `backend/` and `frontend/`** and smoke-test the main
  flows yourself (register a business, add a customer, start a subscription, record a
  payment).
- **Email/SMS notifications** (`utils/notificationService.js`) are architected —
  every trigger point (payment confirmation, invoice generated, subscription
  renewed) calls `notify()` and the event is logged to the `Notification` collection
  — but actual sending is a no-op until you add SMTP credentials or an SMS provider
  key to `.env` and fill in `sendEmail()`/`sendSms()`.
- **AWS S3** isn't wired up. Profile photos and logos currently upload to local disk
  via `routes/uploadRoutes.js` (`multer`), which works fine in Docker/EC2 with a
  mounted volume but won't survive a stateless/serverless deploy. Swap that route's
  implementation for an S3 `PutObject` call when you're ready — the frontend just
  expects `{ url }` back either way.
- **AWS EC2 deployment** isn't something a codebase can include — the Dockerfiles and
  `docker-compose.yml` here are deployment-ready (build once, run anywhere Docker
  runs, EC2 included), but actually provisioning infrastructure is a step you'll do
  with your own AWS account.
- **Socket.io is single-instance as built.** Rooms (`business:<id>`, `user:<id>`)
  live in the one Node process's memory, which is exactly right for the
  `docker-compose.yml` setup here (one backend container). If you ever scale the
  backend horizontally (multiple instances behind a load balancer), add the
  [`@socket.io/redis-adapter`](https://socket.io/docs/v4/redis-adapter/) so a
  notification emitted from one instance still reaches a client connected to
  another — without it, a user could miss live updates if their socket happens to
  land on a different instance than the one that wrote the event.

## Tech stack

- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Axios, Recharts, Lucide icons
- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT, bcrypt, multer, helmet, rate limiting
- **Database:** MongoDB (11 collections — see `backend/models/`)
- **DevOps:** Per-service Dockerfiles + `docker-compose.yml` (mongo + backend + nginx-served frontend)

## Default demo business types

Gym, Clinic, Coaching Institute, Tuition Center, Salon, Yoga Center, Dance Academy,
Music Academy, Sports Academy, Training Center, and a free-text "Other".
