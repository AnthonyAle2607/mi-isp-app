-- Fix search_path for is_private_ip function
CREATE OR REPLACE FUNCTION public.is_private_ip(ip text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
DECLARE
  octets text[];
  first_octet int;
  second_octet int;
BEGIN
  octets := string_to_array(ip, '.');
  
  IF array_length(octets, 1) != 4 THEN
    RETURN false;
  END IF;
  
  first_octet := octets[1]::int;
  second_octet := octets[2]::int;
  
  IF first_octet = 10 THEN
    RETURN true;
  END IF;
  
  IF first_octet = 172 AND second_octet >= 16 AND second_octet <= 31 THEN
    RETURN true;
  END IF;
  
  IF first_octet = 192 AND second_octet = 168 THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;