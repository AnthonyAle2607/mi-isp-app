-- Add IP address and contract number fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS contract_number TEXT;

-- Create index for better performance on IP searches
CREATE INDEX IF NOT EXISTS idx_profiles_ip_address ON public.profiles(ip_address);
CREATE INDEX IF NOT EXISTS idx_profiles_contract_number ON public.profiles(contract_number);