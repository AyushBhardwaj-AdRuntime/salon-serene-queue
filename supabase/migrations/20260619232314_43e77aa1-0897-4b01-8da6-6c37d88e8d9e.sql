
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS owner_phone text,
  ADD COLUMN IF NOT EXISTS business_proof text,
  ADD COLUMN IF NOT EXISTS services_offered text[] NOT NULL DEFAULT '{}';

-- Guard: only admins can flip approval_status to 'approved' or 'rejected'.
-- Owners may set it to 'pending' (resubmit) or leave it unchanged.
CREATE OR REPLACE FUNCTION public.guard_salon_approval()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    IF NEW.approval_status IN ('approved','rejected') THEN
      IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Only admins can approve or reject salons';
      END IF;
    ELSIF NEW.approval_status = 'pending' THEN
      -- Allowed for owner (resubmit) or admin. Clear stale review fields.
      IF NOT (auth.uid() = OLD.owner_id OR public.has_role(auth.uid(), 'admin')) THEN
        RAISE EXCEPTION 'Not allowed';
      END IF;
      NEW.rejection_reason := NULL;
      NEW.reviewed_at := NULL;
      NEW.reviewed_by := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_salon_approval ON public.salons;
CREATE TRIGGER trg_guard_salon_approval
  BEFORE UPDATE ON public.salons
  FOR EACH ROW EXECUTE FUNCTION public.guard_salon_approval();
