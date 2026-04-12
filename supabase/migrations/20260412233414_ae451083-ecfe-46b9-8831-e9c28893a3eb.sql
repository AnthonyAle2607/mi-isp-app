
CREATE OR REPLACE FUNCTION public.lookup_contract_by_cedula(_cedula text)
RETURNS TABLE(full_name text, contract_number text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.full_name, p.contract_number
  FROM public.profiles p
  WHERE p.cedula = _cedula
  LIMIT 1;
$$;
