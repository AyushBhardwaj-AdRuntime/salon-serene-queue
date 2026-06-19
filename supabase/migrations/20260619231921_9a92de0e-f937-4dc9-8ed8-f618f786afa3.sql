
-- 1. Salon approval columns
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Existing salons should remain visible
UPDATE public.salons SET approval_status = 'approved' WHERE approval_status = 'pending';

-- 2. Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','owner','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Admin-only list of pending salons (bypasses public-visibility RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.admin_list_salons(_status text DEFAULT NULL)
RETURNS SETOF public.salons
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.* FROM public.salons s
  WHERE public.has_role(auth.uid(), 'admin')
    AND (_status IS NULL OR s.approval_status = _status)
  ORDER BY s.created_at DESC
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_salons(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_salons(text) TO authenticated;

-- 3. Salon visibility policies
DROP POLICY IF EXISTS "Anyone can view salons" ON public.salons;
DROP POLICY IF EXISTS "Public can view approved salons" ON public.salons;
DROP POLICY IF EXISTS "Owners can view own salon" ON public.salons;
DROP POLICY IF EXISTS "Admins can view all salons" ON public.salons;
DROP POLICY IF EXISTS "Admins can update any salon" ON public.salons;

CREATE POLICY "Public can view approved salons"
  ON public.salons FOR SELECT
  USING (approval_status = 'approved');

CREATE POLICY "Owners can view own salon"
  ON public.salons FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all salons"
  ON public.salons FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any salon"
  ON public.salons FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Seed admin role for the project owner (no-op if user has not signed up yet)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) = lower('ayushbhardwaj1334@gmail.com')
ON CONFLICT DO NOTHING;
