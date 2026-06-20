## Salon Owner Profile Management

A production-grade system: dedicated tables for services, staff, and media; Lovable Cloud Storage for images; owner dashboard for full CRUD; public-facing salon profile page; live stats backed by existing analytics + on-demand queries.

### 1. Database changes (one migration)

Extend `public.salons` with profile fields:
- `description text`
- `contact_number text`
- `instagram_url text`
- `website_url text`
- `logo_url text`
- `google_maps_url text` (optional override; otherwise derived from lat/lng)

New table `public.services` (replaces flat `services_offered` array; keep array for backward compat but stop writing to it):
- `salon_id`, `name`, `price_cents int`, `duration_minutes int`, `category text`, `is_active bool`, `sort_order int`
- RLS: public read for active services; full CRUD for salon owner/staff via `is_salon_staff`.

New table `public.staff_members` (profile cards, distinct from auth-linked `salon_staff` which stays for permissions):
- `salon_id`, `name`, `role`, `experience_years int`, `specialization text`, `bio text`, `photo_url text`, `is_featured bool` (one true per salon enforced by partial unique index), `sort_order int`
- RLS: public read; CRUD for owner/staff.

New table `public.salon_media`:
- `salon_id`, `kind` enum (`gallery|interior|waiting|service_area`), `url text`, `sort_order int`, `caption text`
- RLS: public read; CRUD for owner/staff.

All tables: `id uuid pk`, `created_at`, `updated_at` with `update_updated_at_column` trigger, and required GRANTs (`SELECT` to anon, full CRUD to authenticated, ALL to service_role).

### 2. Storage

Public bucket `salon-media` via `storage_create_bucket`. RLS on `storage.objects`:
- Public SELECT on bucket
- INSERT/UPDATE/DELETE limited to objects whose path starts with `{salon_id}/` where caller is owner/staff of that salon.

Folder convention: `{salon_id}/logo/...`, `{salon_id}/gallery/...`, `{salon_id}/staff/{staff_id}/...`.

### 3. Owner Dashboard UI

Add a tabbed "Salon Profile" section inside the existing `StaffDashboard` (new component `SalonProfileManager.tsx`) with tabs:

1. **Overview** — profile completion meter (% based on: basic info, logo, ≥3 gallery, ≥1 service, ≥1 staff, hours, contact) with quick-action chips for missing items. Stats cards: total customers served, current queue length, today's appointments, avg wait time, most popular service.
2. **Information** — form for name, description, address (with map picker), contact, instagram, website, hours, business status toggle. Reuses pieces of `RegisterSalonForm`.
3. **Gallery** — drag-and-drop multi-upload per category (logo, interior, waiting, service area, general gallery), reorder via drag handles, delete, "preview as customer" toggle.
4. **Services** — table with inline add/edit/delete; fields name/price/duration/category.
5. **Staff** — card grid with add/edit/delete; photo upload; "Mark as Most Requested" toggle (auto-unsets others).

All mutations use Supabase client + react-query invalidation so the public profile updates instantly.

### 4. Public salon profile page

New route `/salon/:id` (`src/pages/SalonProfile.tsx`):
- Hero: logo, name, open/closed badge, rating, address, contact buttons (call/instagram/website/maps).
- Gallery carousel grouped by kind.
- Services list with price & duration.
- Staff grid; featured staff gets a prominent "Most Requested" badge.
- Live queue snapshot + CTAs: "Join Queue" → existing self check-in flow; "Book Appointment" → existing appointment flow.
- SEO: title, meta description, OpenGraph image (logo), JSON-LD `LocalBusiness`.

Link from `Salons.tsx` cards to `/salon/:id`.

### 5. Stats implementation

- Total served, popular service: from `analytics_daily` + `service_analytics` aggregates (single query each).
- Current queue length, today's appointments: live `customers` / `appointments` count for today.
- Avg wait time: use existing dynamic wait calc (preceding durations + half serving).

### Technical details

- Forms: `react-hook-form` + `zod` validation (name ≤100, urls validated, phone format, prices ≥0).
- Image uploads: client uploads directly to Storage using authed Supabase client → store returned public URL in row. Validate type (image/*) and size (≤5MB).
- Drag/reorder: `@dnd-kit/sortable` (small, already-compatible). Persist `sort_order`.
- Featured staff uniqueness: partial unique index `(salon_id) where is_featured` + transactional update.
- Keep `services_offered` array in sync (write-through) so older code paths don't break during transition; later cleanup.
- No changes to auth, queue, or rating flows.

### Out of scope

- Migrating existing `services_offered` text array data into `services` (offer a one-click "import existing" button instead).
- Staff scheduling/availability.
- Per-staff service assignment (can be added later).
