-- Add new queue request status enum
CREATE TYPE public.queue_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Add new appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Add new fields to salons table for hours and status
ALTER TABLE public.salons 
ADD COLUMN is_open BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN is_queue_paused BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN opening_time TIME DEFAULT '09:00',
ADD COLUMN closing_time TIME DEFAULT '18:00',
ADD COLUMN priority_mode TEXT NOT NULL DEFAULT 'fifo' CHECK (priority_mode IN ('fifo', 'appointment_first'));

-- Add request_status to customers table
ALTER TABLE public.customers 
ADD COLUMN request_status queue_request_status NOT NULL DEFAULT 'approved',
ADD COLUMN phone_number TEXT;

-- Create ratings table
CREATE TABLE public.ratings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    customer_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    phone_number TEXT,
    service_type public.service_type NOT NULL,
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 30,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics_daily table for aggregated stats
CREATE TABLE public.analytics_daily (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_customers INTEGER NOT NULL DEFAULT 0,
    avg_wait_time_minutes INTEGER,
    peak_hour INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(salon_id, date)
);

-- Create service_analytics table for service-wise stats
CREATE TABLE public.service_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    service_type public.service_type NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(salon_id, date, service_type)
);

-- Create hourly_analytics table for busy hour tracking
CREATE TABLE public.hourly_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    customer_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(salon_id, date, hour)
);

-- Enable RLS on new tables
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for ratings (anyone can view, anyone can create after service)
CREATE POLICY "Anyone can view ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can create ratings" ON public.ratings FOR INSERT WITH CHECK (true);

-- RLS policies for appointments (public view, staff manage)
CREATE POLICY "Anyone can view appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Anyone can create appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update appointments" ON public.appointments FOR UPDATE USING (is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "Staff can delete appointments" ON public.appointments FOR DELETE USING (is_salon_staff(auth.uid(), salon_id));

-- RLS policies for analytics (staff only)
CREATE POLICY "Staff can view daily analytics" ON public.analytics_daily FOR SELECT USING (is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "Staff can insert daily analytics" ON public.analytics_daily FOR INSERT WITH CHECK (is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "Staff can update daily analytics" ON public.analytics_daily FOR UPDATE USING (is_salon_staff(auth.uid(), salon_id));

CREATE POLICY "Staff can view service analytics" ON public.service_analytics FOR SELECT USING (is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "Staff can insert service analytics" ON public.service_analytics FOR INSERT WITH CHECK (is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "Staff can update service analytics" ON public.service_analytics FOR UPDATE USING (is_salon_staff(auth.uid(), salon_id));

CREATE POLICY "Staff can view hourly analytics" ON public.hourly_analytics FOR SELECT USING (is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "Staff can insert hourly analytics" ON public.hourly_analytics FOR INSERT WITH CHECK (is_salon_staff(auth.uid(), salon_id));
CREATE POLICY "Staff can update hourly analytics" ON public.hourly_analytics FOR UPDATE USING (is_salon_staff(auth.uid(), salon_id));

-- Create trigger for appointments updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate average rating for a salon
CREATE OR REPLACE FUNCTION public.get_salon_avg_rating(salon_uuid UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
    FROM public.ratings
    WHERE salon_id = salon_uuid
$$;

-- Create function to get rating count for a salon
CREATE OR REPLACE FUNCTION public.get_salon_rating_count(salon_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT COUNT(*)::integer
    FROM public.ratings
    WHERE salon_id = salon_uuid
$$;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;