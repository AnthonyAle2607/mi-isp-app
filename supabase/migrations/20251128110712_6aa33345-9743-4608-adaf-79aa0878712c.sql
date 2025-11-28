-- Add subnet and location fields to network_devices table
ALTER TABLE public.network_devices 
ADD COLUMN IF NOT EXISTS subnet text,
ADD COLUMN IF NOT EXISTS location text;

-- Add check constraint to validate private IP ranges
-- 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
CREATE OR REPLACE FUNCTION public.is_private_ip(ip text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  octets text[];
  first_octet int;
  second_octet int;
BEGIN
  -- Split IP into octets
  octets := string_to_array(ip, '.');
  
  -- Basic validation
  IF array_length(octets, 1) != 4 THEN
    RETURN false;
  END IF;
  
  first_octet := octets[1]::int;
  second_octet := octets[2]::int;
  
  -- Check private ranges
  -- 10.0.0.0/8
  IF first_octet = 10 THEN
    RETURN true;
  END IF;
  
  -- 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  IF first_octet = 172 AND second_octet >= 16 AND second_octet <= 31 THEN
    RETURN true;
  END IF;
  
  -- 192.168.0.0/16
  IF first_octet = 192 AND second_octet = 168 THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Create index for subnet grouping
CREATE INDEX IF NOT EXISTS idx_network_devices_subnet ON public.network_devices(subnet);
CREATE INDEX IF NOT EXISTS idx_network_devices_location ON public.network_devices(location);