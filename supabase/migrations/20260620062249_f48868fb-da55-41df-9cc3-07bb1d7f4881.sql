
-- 1. Per-service concurrent capacity
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS parallel_capacity integer NOT NULL DEFAULT 1
    CHECK (parallel_capacity BETWEEN 1 AND 50);

-- 2. Link customers to a specific service row
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS customers_salon_status_idx
  ON public.customers(salon_id, status, queue_number);
CREATE INDEX IF NOT EXISTS customers_salon_service_idx
  ON public.customers(salon_id, service_id, status);

-- 3. Per-salon, per-day queue numbering
ALTER TABLE public.customers
  ALTER COLUMN queue_number DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.assign_queue_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num integer;
  lock_key bigint;
BEGIN
  -- Advisory lock scoped to this salon to prevent races
  lock_key := ('x' || substr(md5(NEW.salon_id::text), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT COALESCE(MAX(queue_number), 0) + 1
    INTO next_num
    FROM public.customers
    WHERE salon_id = NEW.salon_id
      AND created_at::date = (COALESCE(NEW.created_at, now()))::date;

  NEW.queue_number := next_num;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_queue_number ON public.customers;
CREATE TRIGGER trg_assign_queue_number
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_queue_number();

-- 4. Auto-promote the next waiting customer when a slot frees up
CREATE OR REPLACE FUNCTION public.promote_next_waiting()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  freed_service_id uuid;
  freed_service_type service_type;
  freed_salon_id uuid;
  capacity integer;
  serving_count integer;
  next_id uuid;
  lock_key bigint;
BEGIN
  -- Only act when a customer leaves the Serving state
  IF (TG_OP = 'UPDATE' AND OLD.status = 'Serving' AND NEW.status <> 'Serving')
     OR (TG_OP = 'DELETE' AND OLD.status = 'Serving') THEN

    freed_salon_id := OLD.salon_id;
    freed_service_id := OLD.service_id;
    freed_service_type := OLD.service_type;

    lock_key := ('x' || substr(md5(freed_salon_id::text), 1, 16))::bit(64)::bigint;
    PERFORM pg_advisory_xact_lock(lock_key);

    -- Look up capacity for this service (default 1 if no service row linked)
    IF freed_service_id IS NOT NULL THEN
      SELECT parallel_capacity INTO capacity
        FROM public.services WHERE id = freed_service_id;
    END IF;
    capacity := COALESCE(capacity, 1);

    -- Count how many are currently serving for the same service
    SELECT COUNT(*) INTO serving_count
      FROM public.customers
      WHERE salon_id = freed_salon_id
        AND status = 'Serving'
        AND (
          (freed_service_id IS NOT NULL AND service_id = freed_service_id)
          OR (freed_service_id IS NULL AND service_id IS NULL AND service_type = freed_service_type)
        );

    IF serving_count < capacity THEN
      SELECT id INTO next_id
        FROM public.customers
        WHERE salon_id = freed_salon_id
          AND status = 'Waiting'
          AND request_status = 'approved'
          AND (
            (freed_service_id IS NOT NULL AND service_id = freed_service_id)
            OR (freed_service_id IS NULL AND service_id IS NULL AND service_type = freed_service_type)
          )
        ORDER BY queue_number ASC
        LIMIT 1;

      IF next_id IS NOT NULL THEN
        UPDATE public.customers
          SET status = 'Serving'
          WHERE id = next_id;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promote_next_waiting ON public.customers;
CREATE TRIGGER trg_promote_next_waiting
  AFTER UPDATE OR DELETE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_next_waiting();
