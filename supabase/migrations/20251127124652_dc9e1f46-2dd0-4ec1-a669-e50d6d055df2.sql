-- Create network_devices table for internal network management
CREATE TABLE public.network_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ip_address TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK (device_type IN ('servidor', 'nodo', 'troncal', 'cpe')),
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
  description TEXT,
  last_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage network devices
CREATE POLICY "Admins can view network devices"
ON public.network_devices
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert network devices"
ON public.network_devices
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update network devices"
ON public.network_devices
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete network devices"
ON public.network_devices
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_network_devices_updated_at
BEFORE UPDATE ON public.network_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample devices for the 10.255.255.0/24 range
INSERT INTO public.network_devices (name, ip_address, device_type, status, description) VALUES
-- Servidores (1-9)
('Servidor Principal', '10.255.255.1', 'servidor', 'online', 'Servidor central de gestión'),
('Servidor Backup', '10.255.255.2', 'servidor', 'online', 'Servidor de respaldo'),
('Servidor DNS', '10.255.255.3', 'servidor', 'online', 'Servidor DNS interno'),
-- Nodos (10-49)
('Nodo Centro', '10.255.255.10', 'nodo', 'online', 'Nodo distribución zona centro'),
('Nodo Norte', '10.255.255.11', 'nodo', 'online', 'Nodo distribución zona norte'),
('Nodo Sur', '10.255.255.12', 'nodo', 'maintenance', 'Nodo distribución zona sur - En mantenimiento'),
-- Troncales (50-79)
('Troncal Principal', '10.255.255.50', 'troncal', 'online', 'Enlace troncal principal'),
('Troncal Secundario', '10.255.255.51', 'troncal', 'online', 'Enlace troncal secundario'),
('Troncal Backup', '10.255.255.52', 'troncal', 'offline', 'Enlace troncal de respaldo'),
-- CPEs (100-254)
('CPE Cliente 001', '10.255.255.100', 'cpe', 'online', 'Equipo cliente sector A'),
('CPE Cliente 002', '10.255.255.101', 'cpe', 'online', 'Equipo cliente sector A'),
('CPE Cliente 003', '10.255.255.102', 'cpe', 'offline', 'Equipo cliente sector B - Sin conexión'),
('CPE Cliente 004', '10.255.255.103', 'cpe', 'online', 'Equipo cliente sector B');