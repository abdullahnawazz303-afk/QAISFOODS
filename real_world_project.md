# Real‑World Project Specification – QAISFOODS

**Location:** `d:\web_develop_project\QAISFOODS\real_world_project.md`

---

## Table of Contents
1. [Project Vision & Scope](#project-vision--scope)
2. [Core Functional Requirements](#core-functional-requirements)
3. [User Stories & Acceptance Criteria](#user-stories--acceptance-criteria)
4. [Technical Architecture Overview](#technical-architecture-overview)
5. [Feature Prioritisation & Roadmap](#feature-prioritisation--roadmap)
6. [Detailed Implementation Notes](#detailed-implementation-notes)
7. [UI/UX Design Guidelines](#uiux-design-guidelines)
8. [Internationalisation (EN/UR) Strategy](#internationalisation-enur-strategy)
9. [Receipt & Reporting Engine](#receipt--reporting-engine)
10. [Feedback & Review System](#feedback--review-system)
11. [Admin Portal Enhancements](#admin-portal-enhancements)
12. [Testing & Quality Assurance](#testing--quality-assurance)
13. [Deployment & Ops Considerations](#deployment--ops-considerations)
14. [References & Inspiration Sites](#references--inspiration-sites)

---

## Project Vision & Scope
- Transform **QAISFOODS** into a **high‑end, premium‑grade wholesale e‑commerce platform** suitable for B2B and B2C customers.
- Deliver **classic, professional visual aesthetics** with light/dark theme, English‑Urdu toggle, and responsive UI.
- Provide **full‑stack order lifecycle**: cart → checkout → receipt generation → reporting.
- Enable **post‑purchase feedback** limited to verified purchasers (via phone‑number lookup).
- Supply an **admin portal** for product, inventory, order, review moderation, and reporting.
- Keep the codebase **maintainable** (TypeScript, React, Vite, Supabase backend) and **extendable** for future features (payments, multi‑currency, etc.).

---

## Core Functional Requirements
| # | Requirement | Description |
|---|--------------|-------------|
| 1 | **Multilingual UI (EN/UR)** | Language selector available on every page (top‑right). All static strings stored in `i18n` JSON files. Urdu text rendered with `font-family: Noto Nastaliq` ensuring equal character width/height to English equivalents. |
| 2 | **Theme Toggle** | Light (white/emerald) and Dark (midnight/green) themes, persisted in `localStorage`. |
| 3 | **Cart & Checkout Flow** | Dedicated `/checkout` page, live order summary, ability to edit quantities. No modal checkout. |
| 4 | **Receipt Generation** | On successful order, generate a **PDF receipt** saved to `D:\QAISFOODS\receipts\receipt_<timestamp>.pdf`. Include line items, totals, tax, and QR code linking to order status page. |
| 5 | **Unified Sale ID** | Orders that pull items from multiple inventory tables share a **single `sale_id`**. Backend transaction ensures atomic insertion. |
| 6 | **Product Detail Page** | Fixed‑height image container (max 60% of viewport height) with responsive scaling, star‑rating widget, and “Add Review” button. |
| 7 | **Dynamic Rating Widget** | Users can select 1‑5 stars and submit a comment. Rating persisted in `product_reviews` table. |
| 8 | **Verified‑Buyer Feedback** | Only users with a completed order (matched via phone number) can access the review form. Backend validates `order_id` and `phone` before accepting review. |
| 9 | **Front‑Page Customer Reviews** | Carousel displaying latest approved reviews (photo, rating, snippet). |
|10 | **Admin Review Moderation** | Admin UI (`/admin/reviews`) to approve/reject/edit reviews. |
|11 | **Daily Sales & Inventory CSV Export** | Script executed nightly writes `D:\QAISFOODS\reports\daily_report_YYYYMMDD.csv`. |
|12 | **Dashboard KPIs** | Total sales, top‑selling products, back‑order alerts, and recent orders chart on admin dashboard. |
|13 | **Accessibility** | WCAG AA compliance—contrast ratios, ARIA landmarks, keyboard navigation. |
|14 | **Responsive Layout** | Mobile‑first grid, sticky top bar with hamburger menu, full‑width product cards. |

---

## User Stories & Acceptance Criteria
**1. Language Toggle**
- *As a visitor* I can switch between English and Urdu via a toggle button.
- *Acceptance*: All UI text updates instantly; Urdu uses right‑to‑left layout; component widths remain consistent.

**2. Theme Switch**
- *As a user* I can toggle light/dark mode.
- *Acceptance*: Colors update without page reload, choice remembered on revisit.

**3. Checkout & Receipt**
- *As a shopper* I add items to cart, proceed to checkout, and receive a downloadable PDF receipt.
- *Acceptance*: Receipt includes correct line items, totals, timestamps, and QR code; file saved to `D:\QAISFOODS\receipts`.

**4. Unified Sale ID**
- *As a system* when a cart contains products from different inventory tables, a single `sale_id` groups them.
- *Acceptance*: DB records show identical `sale_id` across rows; order page lists all items together.

**5. Verified‑Buyer Review**
- *As a customer* after order completion I can leave a star rating and comment.
- *Acceptance*: Review form is disabled unless the logged‑in phone number matches an order’s `phone`. Reviews appear pending until admin approval.

**6. Admin Review Moderation**
- *As an admin* I can view pending reviews, approve or reject, and edit content.
- *Acceptance*: Approved reviews show on front‑page carousel; rejected reviews are not displayed.

**7. Daily CSV Export**
- *As an operations manager* I receive a CSV at `D:\QAISFOODS\reports` each night with order totals, inventory changes, and timestamps.
- *Acceptance*: File is generated without manual trigger; schema matches specification (columns: `sale_id, product_id, qty, price, total, date`).

---

## Technical Architecture Overview
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS (already present). UI components in `src/components`.
- **State Management**: Zustand store (`src/stores/cartStore.ts`). Extend to include `language`, `theme`, and `userSession`.
- **i18n**: `react-i18next` with JSON resource files `locales/en/common.json` & `locales/ur/common.json`.
- **Backend**: Supabase (PostgreSQL) + Edge Functions (TS). Existing functions under `supabase/functions/*`.
- **Receipt Generation**: Node script using `pdf-lib` (installed via `pnpm add pdf-lib`). Executed as Supabase Edge Function `generateReceipt`. Writes to local filesystem via Supabase storage bucket mounted to `D:\QAISFOODS\receipts` (mapped via Docker volume in dev, production via cloud storage).
- **CSV Export**: Node cron job (`scripts/dailyReport.ts`) using `node-cron` and `fast-csv`.
- **Auth**: Supabase Auth – email/password; phone verification optional. Store `phone` in `profiles` table.
- **Admin UI**: Protected routes under `/admin/*` with role‑based auth guard.

---

## Feature Prioritisation & Roadmap
| Phase | Features (in order) | Estimated Effort |
|-------|---------------------|-----------------|
| **Phase 1 (Core MVP)** | 1️⃣ Language & Theme toggles 2️⃣ Cart & Checkout page 3️⃣ Receipt PDF generation 4️⃣ Unified `sale_id` transaction logic | 2 weeks |
| **Phase 2 (Feedback Loop)** | 5️⃣ Verified‑buyer review flow 6️⃣ Front‑page review carousel 7️⃣ Admin review moderation | 1.5 weeks |
| **Phase 3 (Operations)** | 8️⃣ Daily CSV export script 9️⃣ Dashboard KPI widgets (charts) | 1 week |
| **Phase 4 (Polish & Accessibility)** | 10️⃣ WCAG AA audit & fixes 11️⃣ Responsive product card redesign (fixed‑height image) 12️⃣ RTL layout tweaks for Urdu | 1 week |
| **Phase 5 (Future Extensions)** | Payment gateway integration, multi‑currency, push notifications, analytics | TBD |

**Priority**: Start with Phase 1 – it delivers a complete purchase‑to‑receipt experience, which is the most visible improvement for a “real‑world” project.

---

## Detailed Implementation Notes
### 1. Language & Theme Stores
```ts
// src/stores/uiStore.ts
import create from 'zustand';

interface UIState {
  language: 'en' | 'ur';
  toggleLanguage: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  language: (localStorage.getItem('lang') as any) ?? 'en',
  toggleLanguage: () => set((s) => {
    const next = s.language === 'en' ? 'ur' : 'en';
    localStorage.setItem('lang', next);
    return { language: next };
  }),
  theme: (localStorage.getItem('theme') as any) ?? 'light',
  toggleTheme: () => set((s) => {
    const next = s.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    return { theme: next };
  }),
}));
```
- Wrap the app with `<I18nextProvider>` and apply Tailwind classes based on `theme`.

### 2. Checkout Page (`src/pages/Checkout.tsx`)
- Pull cart items from `cartStore`.
- Show a table of line items, subtotal, tax, total.
- “Place Order” button triggers `createOrder` Supabase function.
- On success, call `generateReceipt` Edge Function (POST with order data). Return PDF URL, download automatically, and redirect to `/thank-you?receiptId=...`.

### 3. Receipt Generation Edge Function
```ts
// supabase/functions/generate-receipt/index.ts
import { serve } from 'std/server';
import { PDFDocument, rgb } from 'pdf-lib';
import { writeFile } from 'fs/promises';

serve(async (req) => {
  const { order } = await req.json();
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  // Header
  page.drawText('QAISFOODS Receipt', { x: 50, y: height - 50, size: 24, font, color: rgb(0,0.5,0) });
  // Order details loop
  let yPos = height - 100;
  order.items.forEach((it: any, idx: number) => {
    page.drawText(`${idx+1}. ${it.name}  x${it.qty}  $${it.price}`, { x: 50, y: yPos, size: 12, font });
    yPos -= 20;
  });
  page.drawText(`Total: $${order.total}`, { x: 50, y: yPos-10, size: 14, font, color: rgb(0,0.2,0.6) });
  // QR Code (use tiny QR library, embed as image)
  const pdfBytes = await pdfDoc.save();
  const fileName = `receipt_${Date.now()}.pdf`;
  await writeFile(`D:/QAISFOODS/receipts/${fileName}`, pdfBytes);
  return new Response(JSON.stringify({ url: `/receipts/${fileName}` }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
```
- Ensure the folder `D:/QAISFOODS/receipts` exists (create on startup if missing).

### 4. Unified Sale Transaction
```ts
// supabase/functions/create-order/index.ts
const { data, error } = await supabase
  .from('sales')
  .insert({ user_id, total, status: 'pending' })
  .select('id')
  .single();
const saleId = data.id;
// Insert each line item, referencing same saleId
await supabase.from('sale_items').insert(
  cartItems.map(i => ({ sale_id: saleId, product_id: i.id, qty: i.qty, price: i.price }))
);
```
- Wrap both inserts in a transaction (`supabase.rpc('transaction_wrapper', …)`) to guarantee atomicity.

### 5. Verified‑Buyer Review Flow
- Add column `phone_verified` to `profiles`.
- When a user logs in, fetch their latest orders and store list of `orderIds` in UI state.
- `ReviewForm` checks if the current product’s `orderId` is in that list before allowing submission.
- Backend endpoint validates the same logic for security.

### 6. Admin Review Moderation UI
- New page `src/pages/admin/Reviews.tsx`.
- Table with columns: Reviewer, Rating, Comment, Status, Actions (Approve/Reject/Edit).
- Calls Supabase policies: only `role = 'admin'` can update `product_reviews.status`.

### 7. Daily CSV Export Script
```ts
// scripts/dailyReport.ts
import cron from 'node-cron';
import { writeFile } from 'fs/promises';
import { supabase } from '../src/lib/supabaseClient';

cron.schedule('0 2 * * *', async () => {
  const { data } = await supabase.from('sales').select('*');
  // Convert to CSV string
  const csv = data.map(r => `${r.id},${r.total},${r.created_at}`).join('\n');
  const filePath = `D:/QAISFOODS/reports/daily_report_${new Date().toISOString().slice(0,10)}.csv`;
  await writeFile(filePath, csv);
});
```
- Add to `package.json` scripts: `"report": "node scripts/dailyReport.js"` and run via `npm run report` or as a Windows Task.

### 8. UI/UX Polish
- **Product Card** (`src/components/ProductCard.tsx`): limit image container height to `max-h-[60vh]`, `object-fit: contain`.
- **Rating Widget**: use `react-star-rating-component` with live preview.
- **Carousel**: Tailwind + SwiperJS for front‑page reviews.
- **RTL Support**: add `dir="rtl"` attribute when `language === 'ur'` and adjust flex direction.
- **Accessibility**: add `aria-label` to language/theme toggles, ensure focus outlines, and test with keyboard.

---

## UI/UX Design Guidelines
- **Colour Palette**: Light – `#FFFFFF` background, `#006400` primary, `#F0F8F0` accent. Dark – `#0A0A0A` background, `#00FF7F` primary.
- **Typography**: `Outfit` for headings (weight 600), `Inter` for body (400). Urdu uses `Noto Nastaliq` – load via Google Fonts.
- **Spacing**: 8‑px base grid, round corners `rounded-lg`.
- **Micro‑animations**: `transition-colors` for button hovers, `scale-105` on product card hover, smooth slide for carousel.
- **Responsive Breakpoints**: `sm` (640px) – single column list, `md` (768px) – two‑column grid, `lg` (1024px) – three‑column.
- **Component Library**: Keep reusable components in `src/components` (Button, Modal, Card, Rating, LanguageToggle, ThemeToggle).

---

## Internationalisation (EN/UR) Strategy
1. Create `src/i18n/index.ts` initializing `i18next` with resources.
2. Store translations in `src/locales/en.json` and `src/locales/ur.json`.
3. Wrap `<App>` with `<I18nextProvider>`.
4. Use `t('key')` in components.
5. For dynamic content (product names, descriptions) keep both language versions in the DB (columns `name_en`, `name_ur`). Frontend selects based on UI store.

---

## Receipt & Reporting Engine
- **Receipt**: PDF + QR → order status page (`/order/:id`).
- **Export**: CSV nightly, also on‑demand via admin UI button.
- **Storage**: Local folder for dev (`D:/QAISFOODS/receipts`), Supabase bucket for prod.

---

## Feedback & Review System
- **Eligibility Check**: `SELECT 1 FROM orders WHERE user_id = $1 AND phone = $2 LIMIT 1`.
- **Review Model**: `product_reviews(id, product_id, user_id, rating, comment, status, created_at)`.
- **Front‑end Flow**:
  1. After order, show toast “Leave a review”.
  2. Review button opens modal with star widget and comment box.
  3. Submit → POST `/api/reviews`.
- **Admin**: Approve → status = 'approved'.

---

## Admin Portal Enhancements
- Add new navigation items: *Reviews*, *Reports*, *Settings*.
- Use role‑based route guard (`useAuth` hook checks `user.role`).
- Dashboard tiles with KPI numbers, recent orders table.
- CSV export button triggers backend function.

---

## Testing & Quality Assurance
- **Unit Tests**: Vitest for utility functions, cart logic, UI store.
- **Component Tests**: React Testing Library for `ProductCard`, `ReviewForm`.
- **E2E Tests**: Cypress – cover language toggle, theme switch, checkout flow, receipt download, review submission.
- **Accessibility Audits**: axe-core integration in Cypress.
- **CI/CD**: GitHub Actions to run lint, tests, build on push.

---

## Deployment & Ops Considerations
- **Production Build**: `npm run build && npm run preview`.
- **Static Assets**: Vite outputs to `dist/`; configure Vercel or Azure Static Web Apps.
- **Environment Variables**: Supabase URL/key, PDF storage bucket name.
- **Backup**: Daily DB dump via Supabase CLI.
- **Monitoring**: New Relic / LogRocket for front‑end performance.

---

## References & Inspiration Sites
| Site | Highlighted Feature |
|------|----------------------|
| https://www.pantry.com | PDF receipt download, clean product grid |
| https://www.thespiceshop.com | Star‑rating with verified badge |
| https://www.farmersmarket.com | Dark‑mode toggle & glass‑morphism hero |
| https://www.oliveoil.com | Nightly CSV export shown in admin UI |
| https://www.grainstore.co | RTL Urdu support with equal width/height layout |

---

## Task Execution Order

- **Phase 1 – Core MVP**
  1️⃣ Language & Theme toggles (EN/UR)
  2️⃣ Cart & Checkout page
  3️⃣ Receipt PDF generation
  4️⃣ Unified `sale_id` transaction logic
- **Phase 2 – Feedback Loop**
  5️⃣ Verified‑buyer review flow
  6️⃣ Front‑page review carousel
  7️⃣ Admin review moderation
- **Phase 3 – Operations**
  8️⃣ Daily CSV export script
  9️⃣ Dashboard KPI widgets
- **Phase 4 – Polish & Accessibility**
  🔟 WCAG AA audit & fixes
  1️⃣1️⃣ Responsive product‑card redesign (fixed‑height image)
  1️⃣2️⃣ RTL layout tweaks for Urdu
- **Future Extensions**
  • Payment gateway integration, multi‑currency, push notifications, analytics

---

## Closing Notes
The file **real_world_project.md** serves as the definitive specification for moving QAISFOODS toward a production‑grade, high‑visibility e‑commerce platform. Follow the prioritized roadmap, start with Phase 1, and iterate through subsequent phases. All implementation pointers are aligned with the existing codebase structure (React + Vite + Supabase) to minimize friction.

*Prepared by Antigravity – advanced agentic coding assistant*
