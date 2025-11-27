import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Header from "@/components/Layout/Header";
import NetworkStatusCards from "@/components/Network/NetworkStatusCards";
import NetworkTopologyMap from "@/components/Network/NetworkTopologyMap";
import NetworkDevicesTable from "@/components/Network/NetworkDevicesTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NetworkDevice {
  id: string;
  name: string;
  ip_address: string;
  device_type: 'servidor' | 'nodo' | 'troncal' | 'cpe';
  status: 'online' | 'offline' | 'maintenance';
  description: string | null;
  last_check: string | null;
  created_at: string;
  updated_at: string;
}

const NetworkManagement = () => {
  const { user, isAdmin, loading } = useAuth();

  const { data: devices = [], isLoading, refetch } = useQuery({
    queryKey: ['network-devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('network_devices')
        .select('*')
        .order('ip_address');
      
      if (error) throw error;
      return data as NetworkDevice[];
    },
    enabled: !!user && isAdmin,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Red de Gestión Interna</h1>
            <p className="text-muted-foreground">Monitoreo de dispositivos en la red 10.255.255.0/24</p>
          </div>
        </div>

        <NetworkStatusCards devices={devices} isLoading={isLoading} />
        
        <NetworkTopologyMap devices={devices} isLoading={isLoading} />
        
        <NetworkDevicesTable devices={devices} isLoading={isLoading} onRefresh={refetch} />
      </main>
    </div>
  );
};

export default NetworkManagement;
