
-- ============ CUSTOMERS ============
DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;

CREATE POLICY "Staff can view customers"
ON public.customers FOR SELECT
TO authenticated
USING (public.is_salon_staff(auth.uid(), salon_id));

REVOKE SELECT ON public.customers FROM anon;
GRANT SELECT ON public.customers TO authenticated;

-- Public-safe view (no phone, no customer_name)
DROP VIEW IF EXISTS public.public_queue;
CREATE VIEW public.public_queue
WITH (security_invoker = false) AS
SELECT
  id,
  queue_number,
  status,
  service_type,
  salon_id,
  estimated_duration_minutes,
  request_status,
  created_at,
  updated_at
FROM public.customers
WHERE request_status = 'approved';

GRANT SELECT ON public.public_queue TO anon, authenticated;

-- Remove customers from realtime publication so PII isn't broadcast to anon subscribers
ALTER PUBLICATION supabase_realtime DROP TABLE public.customers;

-- ============ APPOINTMENTS ============
DROP POLICY IF EXISTS "Anyone can view appointments" ON public.appointments;

CREATE POLICY "Staff can view appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (public.is_salon_staff(auth.uid(), salon_id));

REVOKE SELECT ON public.appointments FROM anon;
GRANT SELECT ON public.appointments TO authenticated;

ALTER PUBLICATION supabase_realtime DROP TABLE public.appointments;

-- Tighten public INSERT (still allowed for booking, but cap notes/name lengths via trigger)
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
CREATE POLICY "Anyone can create appointments"
ON public.appointments FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(customer_name) BETWEEN 1 AND 100
  AND (phone_number IS NULL OR length(phone_number) BETWEEN 5 AND 30)
  AND (notes IS NULL OR length(notes) <= 500)
);

-- ============ LOYALTY_MEMBERS ============
DROP POLICY IF EXISTS "Anyone can view loyalty members" ON public.loyalty_members;

CREATE POLICY "Staff can view loyalty members"
ON public.loyalty_members FOR SELECT
TO authenticated
USING (public.is_salon_staff(auth.uid(), salon_id));

REVOKE SELECT ON public.loyalty_members FROM anon;
GRANT SELECT ON public.loyalty_members TO authenticated;

-- ============ VISIT_HISTORY ============
DROP POLICY IF EXISTS "Anyone can view visit history" ON public.visit_history;

CREATE POLICY "Staff can view visit history"
ON public.visit_history FOR SELECT
TO authenticated
USING (public.is_salon_staff(auth.uid(), salon_id));

REVOKE SELECT ON public.visit_history FROM anon;
GRANT SELECT ON public.visit_history TO authenticated;

-- ============ REWARD_REDEMPTIONS ============
DROP POLICY IF EXISTS "Anyone can view redemptions" ON public.reward_redemptions;

CREATE POLICY "Staff can view redemptions"
ON public.reward_redemptions FOR SELECT
TO authenticated
USING (public.is_salon_staff(auth.uid(), salon_id));

REVOKE SELECT ON public.reward_redemptions FROM anon;
GRANT SELECT ON public.reward_redemptions TO authenticated;

-- ============ SALON_STAFF ============
DROP POLICY IF EXISTS "Anyone can view salon staff" ON public.salon_staff;

CREATE POLICY "Owners and staff can view salon staff"
ON public.salon_staff FOR SELECT
TO authenticated
USING (
  public.is_salon_staff(auth.uid(), salon_id)
);

REVOKE SELECT ON public.salon_staff FROM anon;
GRANT SELECT ON public.salon_staff TO authenticated;

-- ============ SECURITY DEFINER FUNCTIONS ============
-- Rating helpers aren't called from app code; restrict to service_role only.
REVOKE EXECUTE ON FUNCTION public.get_salon_avg_rating(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_salon_avg_rating(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_salon_rating_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_salon_rating_count(uuid) TO service_role;

-- is_salon_staff is used inside RLS for authenticated paths only.
REVOKE EXECUTE ON FUNCTION public.is_salon_staff(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_salon_staff(uuid, uuid) TO authenticated, service_role;
