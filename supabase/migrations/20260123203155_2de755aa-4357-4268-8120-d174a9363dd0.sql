-- Add technical infrastructure fields (CTIF) to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS link_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS node text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS technical_equipment text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS nap_box text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS nap_port text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS olt_equipment text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS onu_serial text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ctif_notes text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.link_type IS 'Type of network link (fiber, radio, etc.)';
COMMENT ON COLUMN public.profiles.node IS 'Network node identifier';
COMMENT ON COLUMN public.profiles.technical_equipment IS 'Technical equipment installed';
COMMENT ON COLUMN public.profiles.nap_box IS 'NAP box identifier';
COMMENT ON COLUMN public.profiles.nap_port IS 'NAP port number';
COMMENT ON COLUMN public.profiles.olt_equipment IS 'OLT equipment identifier';
COMMENT ON COLUMN public.profiles.onu_serial IS 'ONU device serial number';
COMMENT ON COLUMN public.profiles.ctif_notes IS 'Additional infrastructure notes';