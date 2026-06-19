# SalonQ — Project Overview

> A real‑time, multi‑tenant salon queue & appointment platform.
> Customers skip the physical wait. Salons run their floor from one dashboard.

---

## 1. What is SalonQ?

SalonQ is a web application that replaces the chaotic “sit on the bench and wait for your turn” experience at salons and barbershops with a **live, transparent digital queue**.

A customer can:
- Discover nearby salons on a map / list (GPS based).
- See **live wait times** per service before walking in.
- **Join the queue remotely** (or scan a QR code at the door).
- Track their position in real time (“You are next”, “3 ahead of you”).
- Book a future **appointment**.
- Rate the salon after the visit and earn **loyalty points**.

A salon owner / staff member can:
- Register their salon (location, services, durations, hours).
- Manage the queue from a **Staff Dashboard** (Approve / Reject / Serving / Done).
- Toggle **Open / Closed** and **Pause queue**.
- Run a **TV Queue Display** in the waiting area.
- See **analytics** (daily customers, popular services, peak hours).
- Run a **loyalty program** and reward redemptions.

---

## 2. Who is it for?

| Audience | Why they use it |
|---|---|
| **Walk‑in customers** | Stop wasting time waiting; see live ETA, join remotely. |
| **Appointment customers** | Book a slot with a specific service and time. |
| **Salon owners** | Higher throughput, fewer no‑shows, repeat business via loyalty. |
| **Salon staff / receptionists** | Single dashboard to run the floor instead of a paper book. |
| **Salon chains** | Multi‑tenant — many salons on one platform, isolated by RLS. |

---

## 3. What makes it unique

Most “booking apps” are calendar tools. SalonQ is a **live operations system**:

1. **Hybrid queue + appointment model** — supports walk‑ins AND scheduled bookings in the same priority engine (configurable: FIFO vs. appointment‑favored).
2. **Dynamic wait‑time math** — wait = (sum of preceding durations) + (½ of currently‑serving customer’s duration). Updates instantly as the queue changes.
3. **Real‑time everywhere** — TV display, customer phone, and staff dashboard stay in sync through Supabase Realtime / polling.
4. **GPS discovery + Haversine sorting** — sort by nearest, shortest wait, highest rating, or open‑now.
5. **QR self‑check‑in** via Edge Function — customers can join the queue without creating an account.
6. **Public read‑only kiosk view** — anyone can see live queue statuses for nearby salons (no PII exposed).
7. **Service‑aware queues** — different services have different durations, factored into per‑customer ETA.
8. **Phone‑based loyalty** — no app install required for points / rewards.

---

## 4. Core use cases & workflows

### 4.1 Customer remote join (mobile web)
1. Opens app → grants location → sees nearby salons sorted by distance / wait.
2. Taps a salon → sees services + live queue.
3. Taps **Join Queue** → enters name, phone, picks a service.
4. Status = **Pending** → staff approves → **Approved (Waiting)**.
5. Live position counter (“2 ahead of you”) updates as staff progresses queue.
6. When position = 1 → notification “You are next”.
7. Status flips to **Serving**, then **Done**.
8. After **Done** → rating prompt + loyalty points awarded.

### 4.2 Walk‑in via QR
1. Customer scans the QR code at the salon counter.
2. Hits `/checkin/:salonId` → fills name + service → submits.
3. Edge Function `customer-checkin` inserts the row (bypasses anon RLS safely with validation).
4. Receives a queue number and ETA.

### 4.3 Staff floor management
1. Staff logs in → Staff Dashboard.
2. Sees Pending requests → Approves or Rejects.
3. Drags / clicks customers through `Waiting → Serving → Done`.
4. Toggles Open/Closed or Pause Queue when needed.
5. Views analytics tab for daily counts, popular services, peak hours.

### 4.4 TV Queue Display (waiting room)
- Big‑screen route `/display/:salonId` showing **Now Serving** and the **Waiting** list.
- Polls the public `get_public_queue` RPC every 5 s (no PII shown — only queue number + service).

### 4.5 Loyalty
- On `Done`, the system finds/creates a loyalty member by phone number.
- Awards service‑specific points; tracks lifetime points + visit history.
- Staff can define rewards; customers redeem when they have enough points.

---

## 5. Internal architecture

### 5.1 Routing (frontend)

| Route | Purpose |
|---|---|
| `/` | Landing page (marketing + entry) |
| `/salons` | Public salon discovery / kiosk view |
| `/login` | Staff auth |
| `/dashboard` | Staff dashboard (auth required) |
| `/checkin/:salonId` | QR self check‑in |
| `/book/:salonId` | Appointment booking |
| `/display/:salonId` | TV queue display |

### 5.2 Component layers

```
LandingPage / Salons (public)
  └─ PublicQueueView ──► get_public_queue RPC (no PII)
StaffDashboard (auth)
  ├─ QueueManagement   ──► customers (RLS: staff only)
  ├─ AppointmentsTab   ──► appointments
  ├─ LoyaltyManagement ──► loyalty_members / visit_history / rewards
  └─ AnalyticsDashboard──► analytics_daily / hourly_analytics / service_analytics
QueueDisplay (public TV)  ──► get_public_queue RPC
```

### 5.3 Data model (key tables)

- `salons` — name, address, lat/lng, hours, is_open, is_queue_paused, priority_mode
- `salon_staff` — junction (user_id ↔ salon_id)
- `customers` — the live queue (queue_number, status, service_type, phone, request_status)
- `appointments` — scheduled bookings
- `loyalty_members`, `visit_history`, `rewards`, `reward_redemptions`
- `ratings` (1‑5 stars, public read)
- `analytics_daily`, `hourly_analytics`, `service_analytics`

### 5.4 Security model

- **Row Level Security on every table.**
- PII tables (`customers`, `appointments`, `loyalty_members`, `visit_history`, `reward_redemptions`, `salon_staff`) — SELECT restricted to that salon’s staff via `is_salon_staff(auth.uid(), salon_id)`.
- Public reads happen through a **SECURITY DEFINER RPC** `get_public_queue(salon_ids[])` that returns only non‑PII columns (queue number, service, status, ETA).
- `customers` and `appointments` were **removed from the realtime publication** so PII can’t leak via subscriptions; public UIs poll the safe RPC every 5 s.
- **HIBP leaked‑password protection** is enabled.
- Anonymous inserts are constrained (length checks on name/phone/notes; check‑in goes through an Edge Function).

---

## 6. External services & frameworks

| Layer | Tech | Why |
|---|---|---|
| Build / bundler | **Vite 5** | Fast HMR, modern ESM. |
| Language | **TypeScript 5** | Type safety end‑to‑end. |
| UI framework | **React 18** | Component model, ecosystem. |
| Styling | **Tailwind CSS v3** + design tokens (HSL semantic vars) | Themable dark/light mode. |
| Component kit | **shadcn/ui** + Radix primitives | Accessible, customizable. |
| Icons | **lucide‑react** | |
| Routing | **react‑router‑dom** | |
| Forms / validation | **react‑hook‑form** + **zod** | Client + server validation. |
| Charts | **recharts** | Analytics dashboard. |
| State (server) | **@tanstack/react‑query** | Caching + revalidation. |
| Backend (BaaS) | **Lovable Cloud** (Supabase under the hood) | DB, Auth, Edge Functions, Realtime, Storage. |
| Database | **Postgres** (managed) | Tables, RLS, RPC functions. |
| Auth | Email/password + Google OAuth | |
| Realtime | Postgres `LISTEN/NOTIFY` via Supabase channels | Live queue updates for staff. |
| Serverless logic | **Supabase Edge Functions** (Deno) | `customer-checkin` RLS‑safe insert. |
| Geolocation | Browser `navigator.geolocation` + Haversine | GPS discovery & distance sort. |
| AI (available) | Lovable AI Gateway | Reserved for future features (e.g. style try‑on). |

---

## 7. How it actually works (request lifecycle)

**Public TV display (anonymous user)**

```
Browser  ──GET /display/:salonId
         ──RPC get_public_queue([salonId])  (anon, SECURITY DEFINER)
         └─ Postgres returns rows WITHOUT phone/name
Polling every 5s keeps the screen fresh.
```

**Staff approving a queue request**

```
Staff browser (JWT)
   └─ UPDATE customers SET request_status='approved' WHERE id=... AND salon_id=...
        RLS: is_salon_staff(auth.uid(), salon_id) = true
   └─ Supabase Realtime broadcasts row change to all staff dashboards
        (anon does NOT receive — customers table is NOT in publication)
```

**Customer self check‑in via QR**

```
Anon browser → supabase.functions.invoke('customer-checkin', { salon_id, name, phone, service })
   Edge Function (Deno):
     • Validates input
     • Uses service_role key to INSERT into customers
     • Returns queue_number
```

---

## 8. Scale — current capacity & upgrade path

The stack is comfortable at small scale today. Targets and what to do next:

| Tier | Salons | Daily visitors | What it needs |
|---|---|---|---|
| **Today (no changes)** | up to ~1,000 active salons | ~10,000 page views / day; ~50,000 RPC calls/day | Lovable Cloud starter is enough. |
| **Growth** | 1k – 10k salons | 100k pv/day | Move discovery query to **PostGIS** (`geography` + `ST_DWithin`) instead of fetching all salons + Haversine in JS. Add Postgres indexes on `(salon_id, status, request_status, queue_number)`. Upgrade Cloud plan. |
| **Scale** | 10k – 100k salons | 1M pv/day | Add a **CDN** in front of static assets (Cloudflare). Cache `get_public_queue` per salon with `Cache-Control: s-maxage=5`. Move TV display to **Server-Sent Events** broadcast channel instead of polling. Read replicas for analytics. |
| **Hyper-scale** | 100k+ | 10M+ pv/day | Shard by region. Move queue state into a **Redis** layer with Postgres as the source of truth. Background workers (Edge cron) for analytics rollups. SMS/WhatsApp via **Twilio**. |

### Concrete near‑term scaling actions

1. **Indexes** — `CREATE INDEX ON customers (salon_id, status, request_status, queue_number);` and on `appointments (salon_id, appointment_time)`.
2. **PostGIS** for nearby‑salon search.
3. **Edge caching** on `get_public_queue` (5 s TTL is fine — the UI polls at 5 s anyway).
4. **Pagination** on staff lists when a salon has hundreds of pending requests.
5. **Rate limiting** on `customer-checkin` Edge Function (per IP) to block abuse.
6. **Image storage** in Supabase Storage + image CDN for salon photos.

---

## 9. SEO — current state

> Honest snapshot. The app is a SPA, so SEO needs deliberate work; right now it’s minimal.

**What’s in place**
- Single `index.html` with a `<title>` and meta description.
- Responsive viewport.
- Semantic HTML inside the landing page (h1, sections, alt text on icons).
- `robots.txt` (default — allows crawling).

**What’s missing / next steps**
- **Per‑route meta** — `<title>` and `<meta description>` should change per page (`/`, `/salons`, `/book/:id`, `/display/:id`). Implement with `react-helmet-async` or a small Head component.
- **Sitemap** — generate `sitemap.xml` listing `/`, `/salons`, and one URL per published salon (`/salons/:slug`).
- **Salon detail pages with SSR/SSG** — Vite SPAs aren’t great for indexing dynamic salon pages. Options:
  - Move to **Next.js** / **Astro** for per‑salon static pages (best long‑term SEO).
  - Or pre‑render top salons via a build step (`vite-plugin-ssg`).
- **Structured data (JSON‑LD)** — add `LocalBusiness` / `HairSalon` schema per salon (name, address, geo, rating, openingHours). Huge for Google local pack.
- **Canonical tags** + Open Graph / Twitter cards per route.
- **Performance** — already on Vite; ensure images are lazy‑loaded and use `loading="lazy"` + responsive `srcset`.
- **Backlinks** — list each salon on Google Business Profile and link back to its SalonQ page.

**Target keywords to research** (organic):
- “book salon near me”, “salon walk‑in queue”, “barbershop wait time”, “{city} hair salon appointment”, “salon queue management software” (B2B).

Semrush (the SEO data service integrated with the platform) can run keyword and competitor research against the live domain once it’s published — say the word and I’ll pull volumes, difficulty, and competitor gaps.

---

## 10. Roadmap — high‑impact additions

1. **SMS / WhatsApp notifications** (Twilio) — “You’re next”.
2. **Stylist profiles & per‑stylist booking** — creates a defensible moat.
3. **Payments** — Stripe Connect (deposits, no‑show fees, salon subscriptions).
4. **Native mobile wrapper** (Capacitor) — push notifications.
5. **AI style try‑on** — Lovable AI Gateway image edit; viral lever.
6. **Analytics for owners** — revenue per stylist, retention cohort.

---

_Last updated: June 19, 2026_
