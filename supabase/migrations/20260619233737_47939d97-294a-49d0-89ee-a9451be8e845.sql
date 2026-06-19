-- Swap admin email from ayushbhardwaj1334@gmail.com to evenodd13311334@gmail.com

-- 1. Remove admin role from old admin (if it was granted)
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id IN (SELECT id FROM auth.users WHERE lower(email) = lower('ayushbhardwaj1334@gmail.com'));

-- 2. Seed admin role for the new admin (no-op if not signed up yet)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) = lower('evenodd13311334@gmail.com')
ON CONFLICT DO NOTHING;

-- 3. Auto-grant admin role to evenodd13311334@gmail.com on signup (via trigger on auth.users)
CREATE OR REPLACE FUNCTION public.grant_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = lower('evenodd13311334@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_admin_on_signup();