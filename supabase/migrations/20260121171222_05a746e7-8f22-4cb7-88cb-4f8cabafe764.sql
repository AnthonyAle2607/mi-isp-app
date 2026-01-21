-- Create service_plans table with all plan options
CREATE TABLE public.service_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  connection_type TEXT NOT NULL, -- 'fibra' or 'radio'
  speed_mbps INTEGER NOT NULL,
  monthly_price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view plans
CREATE POLICY "Anyone can view active plans" 
ON public.service_plans 
FOR SELECT 
USING (is_active = true);

-- Admins can manage plans
CREATE POLICY "Admins can manage plans" 
ON public.service_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert Fibra Óptica plans
INSERT INTO public.service_plans (name, connection_type, speed_mbps, monthly_price) VALUES
('UltraFibra 200Mbps', 'fibra', 200, 25.00),
('UltraFibra 400Mbps', 'fibra', 400, 30.00),
('UltraFibra 600Mbps', 'fibra', 600, 40.00),
('UltraFibra 1Gbps', 'fibra', 1000, 50.00);

-- Insert Radiofrecuencia plans
INSERT INTO public.service_plans (name, connection_type, speed_mbps, monthly_price) VALUES
('Radio 10Mbps', 'radio', 10, 25.00),
('Radio 25Mbps', 'radio', 25, 37.00),
('Radio 40Mbps', 'radio', 40, 55.00),
('Radio 50Mbps', 'radio', 50, 72.00);

-- Add new columns to profiles for structured address and client data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cedula TEXT,
ADD COLUMN IF NOT EXISTS cedula_type TEXT DEFAULT 'V',
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS municipio TEXT,
ADD COLUMN IF NOT EXISTS parroquia TEXT,
ADD COLUMN IF NOT EXISTS sector TEXT,
ADD COLUMN IF NOT EXISTS calle TEXT,
ADD COLUMN IF NOT EXISTS casa TEXT,
ADD COLUMN IF NOT EXISTS connection_type TEXT DEFAULT 'fibra',
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.service_plans(id),
ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS permanence_months INTEGER DEFAULT 12;