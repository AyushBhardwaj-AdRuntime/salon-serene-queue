
-- Extend salons
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS contact_number text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS google_maps_url text;

-- services
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  duration_minutes integer NOT NULL DEFAULT 15 CHECK (duration_minutes > 0),
  category text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_public_read" ON public.services FOR SELECT USING (true);
CREATE POLICY "services_owner_insert" ON public.services FOR INSERT TO authenticated
  WITH CHECK (public.is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "services_owner_update" ON public.services FOR UPDATE TO authenticated
  USING (public.is_salon_staff(auth.uid(), salon_id))
  WITH CHECK (public.is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "services_owner_delete" ON public.services FOR DELETE TO authenticated
  USING (public.is_salon_staff(auth.uid(), salon_id));
CREATE INDEX IF NOT EXISTS services_salon_idx ON public.services(salon_id, sort_order);
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- staff_members
CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  experience_years integer DEFAULT 0 CHECK (experience_years >= 0),
  specialization text,
  bio text,
  photo_url text,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staff_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_members TO authenticated;
GRANT ALL ON public.staff_members TO service_role;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_members_public_read" ON public.staff_members FOR SELECT USING (true);
CREATE POLICY "staff_members_owner_insert" ON public.staff_members FOR INSERT TO authenticated
  WITH CHECK (public.is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "staff_members_owner_update" ON public.staff_members FOR UPDATE TO authenticated
  USING (public.is_salon_staff(auth.uid(), salon_id))
  WITH CHECK (public.is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "staff_members_owner_delete" ON public.staff_members FOR DELETE TO authenticated
  USING (public.is_salon_staff(auth.uid(), salon_id));
CREATE UNIQUE INDEX IF NOT EXISTS staff_members_one_featured ON public.staff_members(salon_id) WHERE is_featured;
CREATE INDEX IF NOT EXISTS staff_members_salon_idx ON public.staff_members(salon_id, sort_order);
CREATE TRIGGER trg_staff_members_updated BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- salon_media
DO $$ BEGIN
  CREATE TYPE public.salon_media_kind AS ENUM ('logo','gallery','interior','waiting','service_area');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.salon_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  kind public.salon_media_kind NOT NULL DEFAULT 'gallery',
  url text NOT NULL,
  storage_path text,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.salon_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salon_media TO authenticated;
GRANT ALL ON public.salon_media TO service_role;
ALTER TABLE public.salon_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salon_media_public_read" ON public.salon_media FOR SELECT USING (true);
CREATE POLICY "salon_media_owner_insert" ON public.salon_media FOR INSERT TO authenticated
  WITH CHECK (public.is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "salon_media_owner_update" ON public.salon_media FOR UPDATE TO authenticated
  USING (public.is_salon_staff(auth.uid(), salon_id))
  WITH CHECK (public.is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "salon_media_owner_delete" ON public.salon_media FOR DELETE TO authenticated
  USING (public.is_salon_staff(auth.uid(), salon_id));
CREATE INDEX IF NOT EXISTS salon_media_salon_idx ON public.salon_media(salon_id, kind, sort_order);
CREATE TRIGGER trg_salon_media_updated BEFORE UPDATE ON public.salon_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
