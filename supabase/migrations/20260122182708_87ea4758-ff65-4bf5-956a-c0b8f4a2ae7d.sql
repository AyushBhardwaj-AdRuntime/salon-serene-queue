-- Create enum for service types
CREATE TYPE public.service_type AS ENUM ('Haircut', 'Shave', 'Facial', 'Hair Color', 'Beard Trim', 'Full Package');

-- Create enum for customer status
CREATE TYPE public.queue_status AS ENUM ('Waiting', 'Serving', 'Done');

-- Create the customers queue table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_number SERIAL,
    customer_name TEXT NOT NULL,
    service_type service_type NOT NULL,
    status queue_status NOT NULL DEFAULT 'Waiting',
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access since no auth required)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view customers" 
ON public.customers 
FOR SELECT 
USING (true);

-- Create policy for public insert access
CREATE POLICY "Anyone can add customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update access
CREATE POLICY "Anyone can update customers" 
ON public.customers 
FOR UPDATE 
USING (true);

-- Create policy for public delete access
CREATE POLICY "Anyone can delete customers" 
ON public.customers 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for customers table
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;