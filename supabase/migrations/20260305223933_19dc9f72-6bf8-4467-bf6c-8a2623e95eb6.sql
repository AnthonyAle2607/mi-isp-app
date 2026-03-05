
-- Table for real-time traffic snapshots (latest readings per client)
CREATE TABLE public.client_traffic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  download_mbps numeric NOT NULL DEFAULT 0,
  upload_mbps numeric NOT NULL DEFAULT 0,
  is_online boolean NOT NULL DEFAULT false,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for accumulated daily traffic (for monthly consumption)
CREATE TABLE public.client_traffic_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  download_gb numeric NOT NULL DEFAULT 0,
  upload_gb numeric NOT NULL DEFAULT 0,
  peak_download_mbps numeric NOT NULL DEFAULT 0,
  peak_upload_mbps numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ip_address, date)
);

-- Index for fast lookups
CREATE INDEX idx_client_traffic_ip ON public.client_traffic(ip_address);
CREATE INDEX idx_client_traffic_recorded ON public.client_traffic(recorded_at DESC);
CREATE INDEX idx_client_traffic_daily_ip_date ON public.client_traffic_daily(ip_address, date DESC);

-- RLS
ALTER TABLE public.client_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_traffic_daily ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage client_traffic"
  ON public.client_traffic FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage client_traffic_daily"
  ON public.client_traffic_daily FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own traffic (matched by IP in their profile)
CREATE POLICY "Users can view own traffic"
  ON public.client_traffic FOR SELECT TO authenticated
  USING (
    ip_address IN (
      SELECT p.ip_address FROM public.profiles p WHERE p.user_id = auth.uid() AND p.ip_address IS NOT NULL
    )
  );

CREATE POLICY "Users can view own daily traffic"
  ON public.client_traffic_daily FOR SELECT TO authenticated
  USING (
    ip_address IN (
      SELECT p.ip_address FROM public.profiles p WHERE p.user_id = auth.uid() AND p.ip_address IS NOT NULL
    )
  );

-- Service role can insert (for the agent)
CREATE POLICY "Service role can insert traffic"
  ON public.client_traffic FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can insert daily traffic"
  ON public.client_traffic_daily FOR INSERT
  WITH CHECK (true);

-- Allow upsert on daily traffic
CREATE POLICY "Service role can update daily traffic"
  ON public.client_traffic_daily FOR UPDATE
  USING (true);
