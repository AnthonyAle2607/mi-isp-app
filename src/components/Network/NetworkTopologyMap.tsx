import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, HardDrive, Radio, Router, Network } from "lucide-react";
import type { NetworkDevice } from "@/pages/NetworkManagement";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NetworkTopologyMapProps {
  devices: NetworkDevice[];
  isLoading: boolean;
  onDeviceClick?: (device: NetworkDevice) => void;
}

const NetworkTopologyMap = ({ devices, isLoading, onDeviceClick }: NetworkTopologyMapProps) => {
  const [viewMode, setViewMode] = useState<'subnet' | 'type'>('subnet');

  // Group devices by subnet
  const devicesBySubnet = useMemo(() => {
    const grouped: Record<string, NetworkDevice[]> = {};
    devices.forEach(device => {
      const subnet = device.subnet || 'Sin subred';
      if (!grouped[subnet]) grouped[subnet] = [];
      grouped[subnet].push(device);
    });
    return grouped;
  }, [devices]);

  // Group devices by type (legacy view)
  const devicesByType = useMemo(() => ({
    servidores: devices.filter(d => d.device_type === 'servidor'),
    nodos: devices.filter(d => d.device_type === 'nodo'),
    troncales: devices.filter(d => d.device_type === 'troncal'),
    cpes: devices.filter(d => d.device_type === 'cpe'),
  }), [devices]);

  // Unique locations
  const locations = useMemo(() => {
    const locs = new Set(devices.map(d => d.location).filter(Boolean));
    return Array.from(locs) as string[];
  }, [devices]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-[hsl(var(--network-online-bg))] border-[hsl(var(--network-online))]';
      case 'offline': return 'bg-[hsl(var(--network-offline-bg))] border-[hsl(var(--network-offline))]';
      case 'maintenance': return 'bg-[hsl(var(--network-maintenance-bg))] border-[hsl(var(--network-maintenance))]';
      default: return 'bg-muted border-border';
    }
  };

  const getIconColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-[hsl(134,61%,30%)]';
      case 'offline': return 'text-[hsl(0,72%,35%)]';
      case 'maintenance': return 'text-[hsl(45,100%,30%)]';
      default: return 'text-muted-foreground';
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'servidor': return Server;
      case 'nodo': return HardDrive;
      case 'troncal': return Radio;
      case 'cpe': return Router;
      default: return Server;
    }
  };

  const DeviceNode = ({ device }: { device: NetworkDevice }) => {
    const Icon = getDeviceIcon(device.device_type);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`flex flex-col items-center p-2 rounded-lg border-2 ${getStatusColor(device.status)} transition-all hover:scale-110 cursor-pointer ${
                device.status === 'online' ? 'network-pulse' : device.status === 'offline' ? 'animate-pulse' : ''
              }`}
              onClick={() => onDeviceClick?.(device)}
            >
              <Icon className={`h-5 w-5 ${getIconColor(device.status)}`} />
              <span className="text-[10px] font-mono mt-1 text-foreground/80 truncate max-w-[80px]">
                {device.ip_address.split('.').slice(-1)[0]}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <div className="space-y-1">
              <p className="font-medium">{device.name}</p>
              <p className="text-xs font-mono">{device.ip_address}</p>
              <p className="text-xs capitalize">Estado: {device.status}</p>
              {device.location && <p className="text-xs">Ubicación: {device.location}</p>}
              {device.description && (
                <p className="text-xs text-muted-foreground">{device.description}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const SubnetStats = ({ subnet, subnetDevices }: { subnet: string; subnetDevices: NetworkDevice[] }) => {
    const online = subnetDevices.filter(d => d.status === 'online').length;
    const offline = subnetDevices.filter(d => d.status === 'offline').length;
    const maintenance = subnetDevices.filter(d => d.status === 'maintenance').length;
    const location = subnetDevices[0]?.location;

    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {location && <Badge variant="outline" className="text-[10px]">{location}</Badge>}
        <span className="text-[hsl(var(--network-online))]">{online} online</span>
        {offline > 0 && <span className="text-[hsl(var(--network-offline))]">{offline} offline</span>}
        {maintenance > 0 && <span className="text-[hsl(var(--network-maintenance))]">{maintenance} mant.</span>}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Topología de Red</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-secondary/20 rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Network className="h-5 w-5" />
            Topología de Red
          </CardTitle>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[hsl(var(--network-online-bg))] border border-[hsl(var(--network-online))] network-pulse"></span>
              Online
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[hsl(var(--network-offline-bg))] border border-[hsl(var(--network-offline))] animate-pulse"></span>
              Offline
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[hsl(var(--network-maintenance-bg))] border border-[hsl(var(--network-maintenance))]"></span>
              Mantenimiento
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'subnet' | 'type')}>
          <TabsList className="mb-4">
            <TabsTrigger value="subnet">Por Subred</TabsTrigger>
            <TabsTrigger value="type">Por Tipo</TabsTrigger>
          </TabsList>

          <TabsContent value="subnet" className="space-y-4">
            {Object.keys(devicesBySubnet).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay dispositivos configurados</p>
            ) : (
              Object.entries(devicesBySubnet).map(([subnet, subnetDevices]) => (
                <div key={subnet} className="border border-border/50 rounded-lg p-4 bg-secondary/5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-mono font-medium text-sm">{subnet}</h4>
                    <SubnetStats subnet={subnet} subnetDevices={subnetDevices} />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {subnetDevices.map(device => (
                      <DeviceNode key={device.id} device={device} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="type" className="relative py-4">
            {/* Servidores */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2 font-medium">SERVIDORES</p>
              <div className="flex flex-wrap gap-3 justify-center bg-secondary/10 rounded-lg p-4">
                {devicesByType.servidores.map(device => (
                  <DeviceNode key={device.id} device={device} />
                ))}
                {devicesByType.servidores.length === 0 && <span className="text-muted-foreground text-sm">Sin servidores</span>}
              </div>
            </div>

            <div className="flex justify-center mb-2">
              <div className="w-0.5 h-6 bg-border"></div>
            </div>

            {/* Nodos */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2 font-medium">NODOS</p>
              <div className="flex flex-wrap gap-3 justify-center bg-secondary/10 rounded-lg p-4">
                {devicesByType.nodos.map(device => (
                  <DeviceNode key={device.id} device={device} />
                ))}
                {devicesByType.nodos.length === 0 && <span className="text-muted-foreground text-sm">Sin nodos</span>}
              </div>
            </div>

            <div className="flex justify-center mb-2">
              <div className="w-0.5 h-6 bg-border"></div>
            </div>

            {/* Troncales */}
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2 font-medium">TRONCALES</p>
              <div className="flex flex-wrap gap-3 justify-center bg-secondary/10 rounded-lg p-4">
                {devicesByType.troncales.map(device => (
                  <DeviceNode key={device.id} device={device} />
                ))}
                {devicesByType.troncales.length === 0 && <span className="text-muted-foreground text-sm">Sin troncales</span>}
              </div>
            </div>

            <div className="flex justify-center mb-2">
              <div className="w-0.5 h-6 bg-border"></div>
            </div>

            {/* CPEs */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">CPEs</p>
              <div className="flex flex-wrap gap-3 justify-center bg-secondary/10 rounded-lg p-4 max-h-32 overflow-y-auto">
                {devicesByType.cpes.map(device => (
                  <DeviceNode key={device.id} device={device} />
                ))}
                {devicesByType.cpes.length === 0 && <span className="text-muted-foreground text-sm">Sin CPEs</span>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NetworkTopologyMap;