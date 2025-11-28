import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import Header from "@/components/Layout/Header";
import NetworkStatusCards from "@/components/Network/NetworkStatusCards";
import NetworkTopologyMap from "@/components/Network/NetworkTopologyMap";
import NetworkDevicesTable from "@/components/Network/NetworkDevicesTable";
import NetworkFailureSimulator from "@/components/Network/NetworkFailureSimulator";
import NetworkCharts from "@/components/Network/NetworkCharts";
import NetworkDeviceModal from "@/components/Network/NetworkDeviceModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Play, Square } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  subnet: string | null;
  location: string | null;
}

export type StatusFilter = 'all' | 'online' | 'offline' | 'maintenance';
export type TypeFilter = 'all' | 'servidor' | 'nodo' | 'troncal' | 'cpe';

const NetworkManagement = () => {
  const { user, isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof NetworkDevice>('ip_address');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousDevicesRef = useRef<NetworkDevice[]>([]);

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
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Detect status changes and show notifications
  useEffect(() => {
    if (previousDevicesRef.current.length > 0 && devices.length > 0) {
      devices.forEach(device => {
        const prevDevice = previousDevicesRef.current.find(d => d.id === device.id);
        if (prevDevice && prevDevice.status !== device.status) {
          const icon = device.status === 'offline' ? '⚠️' : device.status === 'online' ? '✅' : '🔧';
          toast({
            title: `${icon} Cambio de estado`,
            description: `${device.name} cambió a ${device.status}`,
            variant: device.status === 'offline' ? 'destructive' : 'default',
          });
        }
      });
    }
    previousDevicesRef.current = devices;
  }, [devices]);

  // Update last update timestamp
  useEffect(() => {
    if (!isLoading) {
      setLastUpdate(new Date());
      setIsUpdating(false);
    }
  }, [devices, isLoading]);

  const handleManualRefresh = useCallback(async () => {
    setIsUpdating(true);
    await refetch();
  }, [refetch]);

  // Filter and sort devices
  const filteredDevices = devices
    .filter(device => {
      if (statusFilter !== 'all' && device.status !== statusFilter) return false;
      if (typeFilter !== 'all' && device.device_type !== typeFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          device.name.toLowerCase().includes(query) ||
          device.ip_address.toLowerCase().includes(query) ||
          (device.description?.toLowerCase().includes(query) ?? false)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortColumn] ?? '';
      const bVal = b[sortColumn] ?? '';
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (column: keyof NetworkDevice) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Demo mode functions
  const runDemoSequence = useCallback(async () => {
    setIsDemoRunning(true);
    
    const steps = [
      { delay: 0, action: 'normal', message: '🟢 Estado normal de la red' },
      { delay: 15000, action: 'troncal_fail', message: '⚠️ Simulando falla en troncales...' },
      { delay: 30000, action: 'cpe_fail', message: '🔴 Simulando falla masiva en CPEs...' },
      { delay: 60000, action: 'partial_recovery', message: '🔧 Iniciando recuperación parcial...' },
      { delay: 90000, action: 'full_recovery', message: '✅ Recuperación completa' },
      { delay: 120000, action: 'end', message: '🎬 Demo finalizada' },
    ];

    for (const step of steps) {
      setTimeout(async () => {
        toast({ title: 'Demo', description: step.message });
        
        if (step.action === 'troncal_fail') {
          await supabase
            .from('network_devices')
            .update({ status: 'offline', last_check: new Date().toISOString() })
            .eq('device_type', 'troncal');
        } else if (step.action === 'cpe_fail') {
          const { data: cpes } = await supabase
            .from('network_devices')
            .select('id, ip_address')
            .eq('device_type', 'cpe');
          
          if (cpes) {
            const cpeIds = cpes
              .filter(c => {
                const lastOctet = parseInt(c.ip_address.split('.')[3]);
                return lastOctet >= 100 && lastOctet <= 150;
              })
              .map(c => c.id);
            
            if (cpeIds.length > 0) {
              await supabase
                .from('network_devices')
                .update({ status: 'offline', last_check: new Date().toISOString() })
                .in('id', cpeIds);
            }
          }
        } else if (step.action === 'partial_recovery') {
          await supabase
            .from('network_devices')
            .update({ status: 'online', last_check: new Date().toISOString() })
            .eq('device_type', 'troncal');
        } else if (step.action === 'full_recovery') {
          await supabase
            .from('network_devices')
            .update({ status: 'online', last_check: new Date().toISOString() })
            .neq('status', 'maintenance');
        } else if (step.action === 'end') {
          setIsDemoRunning(false);
        }
        
        queryClient.invalidateQueries({ queryKey: ['network-devices'] });
      }, step.delay);
    }
  }, [queryClient]);

  const stopDemo = useCallback(() => {
    setIsDemoRunning(false);
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
    }
  }, []);

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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Red de Gestión Interna</h1>
            <p className="text-muted-foreground">Monitoreo de dispositivos en múltiples subredes privadas</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={isUpdating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              variant={isDemoRunning ? "destructive" : "default"}
              size="sm"
              onClick={isDemoRunning ? stopDemo : runDemoSequence}
            >
              {isDemoRunning ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Detener Demo
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Demo
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Global Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, IP o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Cards - Clickable */}
        <NetworkStatusCards 
          devices={devices} 
          isLoading={isLoading}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Charts Section */}
        <NetworkCharts devices={devices} isLoading={isLoading} />
        
        {/* Failure Simulator */}
        <NetworkFailureSimulator onSimulate={() => queryClient.invalidateQueries({ queryKey: ['network-devices'] })} />

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'servidor', 'nodo', 'troncal', 'cpe'] as TypeFilter[]).map(type => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type)}
              className="capitalize"
            >
              {type === 'all' ? 'Todos' : type === 'servidor' ? 'Servidores' : type === 'nodo' ? 'Nodos' : type === 'troncal' ? 'Troncales' : 'CPEs'}
            </Button>
          ))}
        </div>
        
        {/* Topology Map */}
        <NetworkTopologyMap 
          devices={filteredDevices} 
          isLoading={isLoading}
          onDeviceClick={setSelectedDevice}
        />
        
        {/* Devices Table */}
        <NetworkDevicesTable 
          devices={filteredDevices} 
          isLoading={isLoading} 
          onRefresh={handleManualRefresh}
          onDeviceClick={setSelectedDevice}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {/* Device Details Modal */}
        <NetworkDeviceModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onStatusChange={() => queryClient.invalidateQueries({ queryKey: ['network-devices'] })}
        />
      </main>
    </div>
  );
};

export default NetworkManagement;
