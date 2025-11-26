-- Add billing management fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_payment_date date,
ADD COLUMN IF NOT EXISTS next_billing_date date DEFAULT (date_trunc('month', CURRENT_DATE) + interval '1 month' + interval '4 days')::date;

-- Create support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  ticket_type text NOT NULL CHECK (ticket_type IN ('technical', 'billing', 'service')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  admin_response text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Create trigger for support_tickets updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check and suspend accounts without payment
CREATE OR REPLACE FUNCTION public.check_and_suspend_unpaid_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run on the 5th day of the month
  IF EXTRACT(DAY FROM CURRENT_DATE) = 5 THEN
    -- Suspend accounts that haven't paid in the current billing cycle
    UPDATE public.profiles
    SET account_status = 'suspended',
        updated_at = now()
    WHERE account_status = 'active'
      AND (last_payment_date IS NULL 
           OR last_payment_date < date_trunc('month', CURRENT_DATE));
  END IF;
END;
$$;

-- Function to reactivate account when payment is received
CREATE OR REPLACE FUNCTION public.reactivate_account_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile when payment is verified
  IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
    UPDATE public.profiles
    SET account_status = 'active',
        last_payment_date = NEW.payment_date,
        next_billing_date = (date_trunc('month', NEW.payment_date) + interval '1 month' + interval '4 days')::date,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-reactivate on payment verification
CREATE TRIGGER auto_reactivate_on_payment
  AFTER UPDATE ON public.payment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.reactivate_account_on_payment();