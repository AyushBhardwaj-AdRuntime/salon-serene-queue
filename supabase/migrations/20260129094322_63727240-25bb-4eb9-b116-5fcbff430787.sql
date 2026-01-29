-- Create loyalty_members table to track customer enrollment
CREATE TABLE public.loyalty_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    total_points INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    total_visits INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(salon_id, phone_number)
);

-- Create visit_history table
CREATE TABLE public.visit_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    loyalty_member_id UUID NOT NULL REFERENCES public.loyalty_members(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    service_type TEXT NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rewards table for available rewards
CREATE TABLE public.rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward_redemptions table
CREATE TABLE public.reward_redemptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    loyalty_member_id UUID NOT NULL REFERENCES public.loyalty_members(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    points_used INTEGER NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'redeemed'
);

-- Enable RLS on all tables
ALTER TABLE public.loyalty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Loyalty members policies
CREATE POLICY "Anyone can view loyalty members" 
ON public.loyalty_members FOR SELECT USING (true);

CREATE POLICY "Staff can create loyalty members" 
ON public.loyalty_members FOR INSERT 
WITH CHECK (is_salon_staff(auth.uid(), salon_id));

CREATE POLICY "Staff can update loyalty members" 
ON public.loyalty_members FOR UPDATE 
USING (is_salon_staff(auth.uid(), salon_id));

-- Visit history policies
CREATE POLICY "Anyone can view visit history" 
ON public.visit_history FOR SELECT USING (true);

CREATE POLICY "Staff can create visit history" 
ON public.visit_history FOR INSERT 
WITH CHECK (is_salon_staff(auth.uid(), salon_id));

-- Rewards policies
CREATE POLICY "Anyone can view rewards" 
ON public.rewards FOR SELECT USING (true);

CREATE POLICY "Staff can manage rewards" 
ON public.rewards FOR INSERT 
WITH CHECK (is_salon_staff(auth.uid(), salon_id));

CREATE POLICY "Staff can update rewards" 
ON public.rewards FOR UPDATE 
USING (is_salon_staff(auth.uid(), salon_id));

CREATE POLICY "Staff can delete rewards" 
ON public.rewards FOR DELETE 
USING (is_salon_staff(auth.uid(), salon_id));

-- Reward redemptions policies
CREATE POLICY "Anyone can view redemptions" 
ON public.reward_redemptions FOR SELECT USING (true);

CREATE POLICY "Staff can create redemptions" 
ON public.reward_redemptions FOR INSERT 
WITH CHECK (is_salon_staff(auth.uid(), salon_id));

-- Add triggers for updated_at
CREATE TRIGGER update_loyalty_members_updated_at
BEFORE UPDATE ON public.loyalty_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at
BEFORE UPDATE ON public.rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();