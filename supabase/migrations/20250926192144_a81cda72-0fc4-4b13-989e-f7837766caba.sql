-- Add installation date to profiles table
ALTER TABLE public.profiles 
ADD COLUMN installation_date DATE DEFAULT CURRENT_DATE;