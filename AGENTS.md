# QAIS Foods — AI & Developer Context

Read this file first when working on this repository (Cursor, Antigravity, Copilot, etc.).

## What this project is

**QAIS Foods (LFO-FCMS)** is a lab/university ERP + public website for a lentil packaging factory in Pakistan. It digitizes inventory, B2B sales, vendor/customer ledgers, cash flow, online orders, and a customer-facing wholesale portal.

- **Brand:** QAIS Foods / Qais Foods
- **Domain:** Factory operations + e-commerce style public shop
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions, RLS)
- **Frontend only in this repo** — no separate Node API server for the app runtime

## Quick start (evaluators & AI)

```bash
npm install
npm run dev            # http://localhost:5000
```

- **`npm install`** on a fresh clone creates `.env` from `.env.example` (shared lab Supabase keys).
- **Students** submit their own `.env` when asked; instructors do not need a separate copy step.
- **Package manager:** npm only (`package-lock.json`). Do not mix with pnpm/yarn on the same `node_modules`.
- **Node:** 18+
- **No** `npm install --legacy-peer-deps` required (React 19 peer deps are resolved in `package.json`).

## Technology stack

| Layer | Choice |
|--------|--------|
| UI | React 19, TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS v4 (`@import 'tailwindcss'` in `src/index.css`, `@tailwindcss/postcss`) |
| Components | shadcn/ui (Radix primitives) |
| Routing | react-router-dom v6 (v7 future flags enabled) |
| Server state | TanStack React Query (light use) |
| Client state | Zustand (`src/stores/*`) |
| Backend | Supabase JS v2 (`src/integrations/supabase/client.ts`) |
| i18n | i18next + JSON in `src/locales/{en,ur}/` |
| Urdu UI (ERP/portal) | `AutoTranslationContainer` + Google Translate (unofficial client-side API) |
| Charts | Recharts |
| Motion | Framer Motion (marketing pages) |

### Version migration notes (important)

- Upgraded from **React 18 → 19** and **Tailwind 3 → 4**.
- Removed **`next-themes`** — theme is `useUIStore` + `document.documentElement.classList` (`ThemeSwitcher`).
- **`react-day-picker` v9** — calendar component in `src/components/ui/calendar.tsx`.
- Locales live under **`src/locales/`** (not imported from `public/`).

## Environment variables

| Variable | Required | Usage |
|----------|----------|--------|
| `VITE_SUPABASE_URL` | Yes (for real data) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key (frontend only) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend/scripts only | Never in frontend |
| `VITE_ADMIN_WHATSAPP` | Optional | WhatsApp notifications (`src/lib/whatsapp.ts`) |

Without Supabase env vars, the app boots but shows a console warning and API calls fail.

## Application structure

```
src/
  App.tsx              # Routes + auth guards
  main.tsx             # Entry
  index.css            # Tailwind v4 theme tokens
  i18n.ts              # i18next setup
  pages/               # Route pages (public, ERP, portal)
  components/          # UI + layout (PublicLayout, AppLayout, sidebar)
  stores/              # Zustand domain stores
  integrations/supabase/client.ts
  lib/                 # formatters, whatsapp, utils
  locales/en|ur/       # Static translations (public site)
```

## User roles & auth

Roles in `public.users.role`: `admin` | `manager` | `cashier` | `viewer` | `customer`.

- **`viewer`** = unregistered — session cleared on login/restore.
- **Staff** → ERP routes under `ProtectedRoute` + `AppLayout`.
- **Customer** → `/portal` (`CustomerPortal`), redirected away from ERP.
- **Google OAuth** → `/auth/callback` → `finalizeGoogleLogin()` in `authStore`.
- **Email/password** → standard Supabase sign-in.

## Route map

### Public ( `PublicLayout` )

| Path | Page |
|------|------|
| `/` | Home |
| `/about` | About |
| `/contact` | Contact |
| `/shop` | Shop catalogue |
| `/product/:id` | Product details |
| `/track-order` | Guest order tracking |
| `/reviews` | Public reviews |

### Auth

| Path | Page |
|------|------|
| `/login` | Login |
| `/register` | Register |
| `/request-access` | Wholesale access request |
| `/auth/callback` | OAuth callback |

### Customer

| Path | Page |
|------|------|
| `/portal` | Customer portal (ledger, orders, rate card) |

### Staff ERP ( `ProtectedRoute` + `AppLayout` )

| Path | Feature |
|------|---------|
| `/dashboard` | KPIs |
| `/manage-items` | Shop products + rate card prices |
| `/inventory` | Batches / stock |
| `/sales` | B2B sales |
| `/customers` | Customer CRM |
| `/customer-ledger` | Customer ledger |
| `/customer-requests` | Approve wholesale signups (edge function) |
| `/vendors` | Vendors |
| `/vendor-ledger` | Vendor ledger |
| `/vendor-payables` | Payables |
| `/advance-bookings` | Advance bookings |
| `/waste` | Waste management |
| `/online-orders` | Registered customer online orders |
| `/guest-orders` | Guest checkout orders |
| `/bank-cheques` | Cheques |
| `/cash-flow` | Daily cash (Rokar) |
| `/reports` | Reports |
| `/hero-slides` | Homepage slider CMS |
| `/manage-reviews` | Moderate reviews |

`src/pages/RateCard.tsx` exists but is **not routed** — pricing is edited in **Manage Items**.

## Key Zustand stores

| Store | Responsibility |
|-------|----------------|
| `authStore` | Session, role, login/logout/OAuth |
| `uiStore` | Theme, public vs portal language |
| `rateCardStore` | `rate_card` table |
| `cartStore` | Public cart (localStorage `qais-cart`) |
| `salesStore` | Sales + payments |
| `inventoryStore` | Batches |
| `customerStore` | Customers + provision helper |
| `vendorStore` | Vendors, purchases, payments |
| `onlineOrderStore` | Online orders |
| `bookingStore` | Advance bookings |
| `cashFlowStore` | Cash days |
| `chequeStore` | Cheques |
| `wasteStore` | Waste entries |

## Database & migrations

SQL files at repo root (apply to Supabase in order as needed):

- `master_migration.sql`, `supabase_full_schema_v2_combined.sql`
- Feature migrations: `migration_*.sql`

Edge function: `supabase/functions/provision-customer/` — called when approving customer requests.

## Conventions for AI edits

1. Match existing patterns (Zustand stores, shadcn components, `formatPKR`, toast via `sonner`).
2. Keep changes minimal; this is a lab project under evaluation.
3. Use **npm**, not pnpm, when refreshing dependencies.
4. Do not commit `.env` or service role keys.
5. Prefer `src/locales` for new i18n keys on the public site.
6. ERP Urdu strings often rely on `AutoTranslationContainer` — avoid fighting React DOM with manual text changes on the same nodes when possible.

## Common issues

| Symptom | Cause | Fix |
|---------|--------|-----|
| Vite `dep-*.js` not found | Corrupt/mixed `node_modules` (pnpm + npm) | Delete `node_modules`, run `npm install` only |
| `npm install` ERESOLVE | Old React 18-only packages | Use current `package.json` (no `next-themes@0.3`) |
| 500 on localhost | Vite transform crash (often CSS/Tailwind) | Clean reinstall; check terminal stack trace |
| Supabase errors in console | Missing env, RLS, or migrations | Configure `.env` and run SQL migrations |
| `featured_reviews` 401 on home | Anon cannot read join table | Fixed: home reads `reviews` where `is_allowed=true`; run `migration_reviews_fix.sql` for full review CMS |
| Public locale Vite warning | Importing from `public/` | Use `src/locales/` (already fixed) |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server :5000 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
