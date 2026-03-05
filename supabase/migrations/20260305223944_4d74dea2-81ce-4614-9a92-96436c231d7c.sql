
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Service role can insert traffic" ON public.client_traffic;
DROP POLICY IF EXISTS "Service role can insert daily traffic" ON public.client_traffic_daily;
DROP POLICY IF EXISTS "Service role can update daily traffic" ON public.client_traffic_daily;
