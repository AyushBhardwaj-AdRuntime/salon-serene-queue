## Goal
Replace the current `/salon/:id` page with a premium, mobile-first salon details experience that covers every section in the brief, reusing existing data hooks and tables (salons, services, staff_members, salon_media, ratings, customers).

## Sections (in render order)

1. **Sticky hero header** — back button, logo chip, salon name, Join Queue CTA.
2. **Hero card**
   - Logo, name, Open/Closed pill, star rating + count
   - Address, today's hours, queue length, **estimated wait time** (computed from `services.duration_minutes` average × waiting count, or fallback 15 min × count)
   - Primary action row: **Join Queue**, **Book Appointment**, **Get Directions**
3. **Quick queue snapshot strip** — 3 stat tiles: Current Position (if user already in queue, queried by phone — skip if anonymous), People Waiting, Est. Wait.
4. **Photo gallery** — horizontal snap-scroll carousel on mobile, grid on md+; lightbox dialog on tap.
5. **Featured staff banner** — existing "Most Requested" card, upgraded styling.
6. **Our Team** — grid cards (photo, name, specialization, experience, "Most Requested" badge).
7. **Services & Pricing** — elegant cards grouped by category, showing price (₹) + duration; "Book" mini-CTA per row.
8. **Customer Reviews** — average rating, total count, recent 5 reviews fetched from `ratings` (with comment + created_at).
9. **Business Information** — phone (tel: link), opening hours, Instagram, website, address w/ map link.
10. **Bottom sticky CTA bar** (mobile only) — Join Queue + Book Appointment for one-tap access.

## Design

- Luxury salon aesthetic: warm gradient hero (using existing rose-gold/coral tokens), glass-morphism cards, soft shadows, rounded-2xl, generous spacing.
- Smooth entry animations via `animate-fade-in` / `animate-scale-in` per section.
- Dark mode supported via existing semantic tokens (no hardcoded colors).
- Mobile-first: single-column < md, multi-column ≥ md; sticky top header + sticky bottom CTA on mobile.
- Use `lucide-react` icons throughout, shadcn `Card`, `Badge`, `Button`, `Dialog` (for lightbox), `ScrollArea`.

## Data

- Single `useEffect` parallel load (already in place): salon, services, staff, media, rating avg/count, public queue.
- Add: fetch last 5 ratings with comments — `supabase.from('ratings').select('rating,comment,created_at').eq('salon_id', id).order('created_at', {ascending:false}).limit(5)`.
- Est. wait = `waitingCount × avgServiceDuration` (avg from services list, fallback 15).
- Reuse existing routes: `/checkin/:salonId` (Join Queue), `/book/:salonId` (Book Appointment).

## Files

- **Edit** `src/pages/SalonProfile.tsx` — full rewrite into composed sections; keep route, hook calls, JSON-LD/SEO.
- **New** `src/components/profile/public/` (small presentational pieces if file gets long): `HeroCard.tsx`, `GalleryCarousel.tsx`, `ServicesList.tsx`, `StaffGrid.tsx`, `ReviewsSection.tsx`, `BusinessInfo.tsx`, `StickyBottomBar.tsx`. Optional — only split if `SalonProfile.tsx` > ~300 lines.

## Out of scope

- Per-user "current position in queue" requires phone lookup; will show only if a phone is provided via query param or local storage, otherwise omit gracefully.
- No DB migration. No new tables. No changes to owner dashboard.
