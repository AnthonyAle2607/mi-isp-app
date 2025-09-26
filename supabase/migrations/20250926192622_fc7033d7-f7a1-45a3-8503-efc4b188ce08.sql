-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false);

-- Create table for payment receipts
CREATE TABLE public.payment_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_url TEXT NOT NULL,
  amount DECIMAL(10,2),
  payment_date DATE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment receipts
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Policies for payment receipts
CREATE POLICY "Users can view their own receipts" 
ON public.payment_receipts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts" 
ON public.payment_receipts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all receipts" 
ON public.payment_receipts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all receipts" 
ON public.payment_receipts 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for payment receipts
CREATE POLICY "Users can upload their own receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all payment receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'payment-receipts' AND has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_payment_receipts_updated_at
BEFORE UPDATE ON public.payment_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();