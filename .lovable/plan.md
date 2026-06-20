# Fix logical gaps in the queue system

You're right — two real bugs today:

1. **Queue numbers are global, not per-salon.** `customers.queue_number` is a single `SERIAL` shared across every salon. Salon A's first customer might be `#247`. It must restart from **1 for each salon** (and reset each day so numbers stay small).
2. **No per-service capacity.** A salon owner cannot say "I can serve 5 haircuts at the same time, but only 1 facial." Today every customer just stacks into one waiting line and the owner manually decides who is being served.

Below is the fix.

## 1. Per-salon, per-day queue numbering

- Stop using the global `SERIAL`. Add a Postgres `BEFORE INSERT` trigger on `customers` that sets `queue_number = COALESCE(MAX(queue_number), 0) + 1` scoped to `salon_id` **and** `created_at::date = today`.
- First customer of the day at every salon is always `#1`. Next day it resets.
- No change needed in the UI — it already renders `#{queue_number}`.

## 2. Per-service concurrent capacity (owner-defined)

Add a `parallel_capacity INTEGER NOT NULL DEFAULT 1` column to the existing `services` table. Meaning: "how many customers can be in `Serving` state for this service at the same time."

Owner dashboard → **Services Manager**: add a "Customers at a time" number input next to price/duration. Examples:

| Service  | Price | Duration | Parallel capacity |
|----------|-------|----------|-------------------|
| Haircut  | ₹200  | 30 min   | 5                 |
| Spa      | ₹800  | 60 min   | 2                 |
| Facial   | ₹500  | 45 min   | 1                 |

### How capacity drives the queue

- A customer joining picks a service. They go in as `Waiting`.
- The system (and the dashboard) treats the first `N` waiting customers for that service as the **active batch**, where `N = parallel_capacity − currentlyServingForThatService`.
- When the owner marks a serving customer `Done`, the next `Waiting` of the same service is auto-promoted to `Serving` (DB trigger), so a free slot is never wasted.
- Wait-time estimate becomes accurate: `ceil(positionInServiceQueue / capacity) × duration_minutes` instead of `totalWaiting × avgDuration`.

### Customer-facing effect

On `SalonProfile` and `CustomerCheckin`, per service we show:
- `Now serving: 3 / 5` (capacity indicator)
- `2 people waiting for Haircut · ~12 min`
- Position is computed **within the service**, not across the whole salon, which matches the user's mental model ("I'm 2nd for haircut, not 14th overall").

## 3. Link customers to the services table

Today `customers.service_type` is a hard-coded enum (`Haircut`, `Shave`, …) and `services` is free-text per salon — they don't talk to each other, so capacity can't be enforced.

Fix: add `service_id UUID NULL REFERENCES public.services(id)` to `customers`. New check-ins write `service_id`; we keep `service_type` for backward compatibility and display. The edge function `customer-checkin` looks up duration from `services` when `service_id` is provided, falling back to the current `SERVICE_DURATIONS` map otherwise.

## Technical details

**Migration:**
- `ALTER TABLE public.services ADD COLUMN parallel_capacity int NOT NULL DEFAULT 1 CHECK (parallel_capacity BETWEEN 1 AND 50);`
- `ALTER TABLE public.customers ADD COLUMN service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;`
- Drop the `SERIAL` default on `customers.queue_number` (keep column, make it `NOT NULL`).
- New function `assign_queue_number()` + `BEFORE INSERT` trigger on `customers` scoping `MAX(queue_number)+1` by `(salon_id, created_at::date)`. Wrap in advisory lock per salon to avoid race on concurrent inserts.
- New function `promote_next_waiting()` + `AFTER UPDATE` trigger on `customers`: when a row moves to `Done`/`Cancelled`, look up its service capacity and, if `serving_count < capacity`, promote the oldest matching `Waiting` row to `Serving`.

**Frontend:**
- `src/components/profile/ServicesManager.tsx` — add capacity input, wire to insert/update.
- `src/hooks/useCustomers.ts` — group by service, compute per-service position and wait.
- `src/components/StaffDashboard.tsx` and `PublicQueueView.tsx` — show `serving / capacity` chip per service.
- `src/pages/CustomerCheckin.tsx` and `SalonProfile.tsx` — show per-service wait and pass `service_id` to the edge function.
- `supabase/functions/customer-checkin/index.ts` — accept optional `service_id`, look up duration from `services`, reject if salon's service is inactive.

**Out of scope (ask if you want them next):**
- Per-staff capacity (e.g. "Ravi can do 2 haircuts in parallel"). Today capacity is salon-level per service.
- Time-window slot booking. This plan only fixes walk-in queue capacity; appointments stay as-is.
