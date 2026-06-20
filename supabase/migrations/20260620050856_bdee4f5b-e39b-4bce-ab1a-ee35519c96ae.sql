
-- Find and drop any trigger using guard_salon_approval, then update rows
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tgname FROM pg_trigger
    WHERE tgrelid = 'public.salons'::regclass
      AND NOT tgisinternal
      AND tgfoid = 'public.guard_salon_approval()'::regprocedure
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.salons', r.tgname);
  END LOOP;
END$$;

DROP FUNCTION IF EXISTS public.guard_salon_approval() CASCADE;

ALTER TABLE public.salons ALTER COLUMN approval_status SET DEFAULT 'approved';
UPDATE public.salons SET approval_status = 'approved', rejection_reason = NULL, reviewed_at = NULL, reviewed_by = NULL WHERE approval_status <> 'approved';

DELETE FROM auth.users;
