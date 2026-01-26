-- Add database-level constraints for customer name validation
-- This enforces data quality even if client-side validation is bypassed

-- Add constraint to ensure customer_name is between 1 and 100 characters
ALTER TABLE public.customers 
ADD CONSTRAINT customer_name_length 
CHECK (
  char_length(customer_name) >= 1 
  AND char_length(customer_name) <= 100
);

-- Add constraint to ensure customer_name is not just whitespace
ALTER TABLE public.customers 
ADD CONSTRAINT customer_name_not_empty 
CHECK (trim(customer_name) != '');