
DROP VIEW IF EXISTS public.public_queue;

CREATE OR REPLACE FUNCTION public.get_public_queue(_salon_ids uuid[] DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  queue_number integer,
  status queue_status,
  service_type service_type,
  salon_id uuid,
  estimated_duration_minutes integer,
  request_status queue_request_status,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.queue_number,
    c.status,
    c.service_type,
    c.salon_id,
    c.estimated_duration_minutes,
    c.request_status,
    c.created_at,
    c.updated_at
  FROM public.customers c
  WHERE c.request_status = 'approved'
    AND c.status IN ('Waiting', 'Serving')
    AND (_salon_ids IS NULL OR c.salon_id = ANY (_salon_ids));
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_queue(uuid[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_public_queue(uuid[]) TO anon, authenticated, service_role;
