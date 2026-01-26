-- Create salons table
CREATE TABLE public.salons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    owner_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT salon_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- Create salon_staff table to link users to salons
CREATE TABLE public.salon_staff (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(salon_id, user_id)
);

-- Add salon_id to customers table
ALTER TABLE public.customers 
ADD COLUMN salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_staff ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is staff of a salon
CREATE OR REPLACE FUNCTION public.is_salon_staff(_user_id UUID, _salon_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.salon_staff
        WHERE user_id = _user_id AND salon_id = _salon_id
    ) OR EXISTS (
        SELECT 1 FROM public.salons
        WHERE id = _salon_id AND owner_id = _user_id
    )
$$;

-- Salons RLS policies
-- Anyone can view salons (for public queue display)
CREATE POLICY "Anyone can view salons"
ON public.salons FOR SELECT
USING (true);

-- Authenticated users can create salons
CREATE POLICY "Authenticated users can create salons"
ON public.salons FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Only salon owner can update their salon
CREATE POLICY "Owners can update their salon"
ON public.salons FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

-- Only salon owner can delete their salon
CREATE POLICY "Owners can delete their salon"
ON public.salons FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- Salon staff RLS policies
-- Anyone can view staff (for verification purposes)
CREATE POLICY "Anyone can view salon staff"
ON public.salon_staff FOR SELECT
USING (true);

-- Only salon owner can add staff
CREATE POLICY "Owners can add staff"
ON public.salon_staff FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
);

-- Only salon owner can remove staff
CREATE POLICY "Owners can remove staff"
ON public.salon_staff FOR DELETE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.salons WHERE id = salon_id AND owner_id = auth.uid())
);

-- Drop old customers RLS policies
DROP POLICY IF EXISTS "Anyone can add customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can update customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can delete customers" ON public.customers;

-- New customers RLS policies
-- Keep public SELECT for queue display
-- Anyone can view customers remains unchanged

-- Only salon staff can add customers
CREATE POLICY "Staff can add customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (public.is_salon_staff(auth.uid(), salon_id));

-- Only salon staff can update customers  
CREATE POLICY "Staff can update customers"
ON public.customers FOR UPDATE
TO authenticated
USING (public.is_salon_staff(auth.uid(), salon_id));

-- Only salon staff can delete customers
CREATE POLICY "Staff can delete customers"
ON public.customers FOR DELETE
TO authenticated
USING (public.is_salon_staff(auth.uid(), salon_id));

-- Add trigger for salons updated_at
CREATE TRIGGER update_salons_updated_at
BEFORE UPDATE ON public.salons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for salons and customers
ALTER PUBLICATION supabase_realtime ADD TABLE public.salons;