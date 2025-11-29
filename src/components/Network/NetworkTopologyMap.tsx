import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, HardDrive, Radio, Network, ChevronRight, Users } from "lucide-react";
import type { NetworkDevice } from "@/pages/NetworkManagement";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

interface NetworkTopologyMapProps {
  devices: NetworkDevice[];
  isLoading: boolean;
  onDeviceClick?: (device: NetworkDevice) => void;
  onNodeDrillDown?: (device: NetworkDevice) => void;
}

const NetworkTopologyMap = ({ devices, isLoading, onDeviceClick, onNodeDrillDown }: NetworkTopologyMapProps) => {
  // Filter only infrastructure devices (no CPEs)
  const infrastructureDevices = useMemo(() => 
    devices.filter(d => d.device_type !== 'cpe'), 
    [devices]
  );

  // Group by location for the hierarchical view
  const devicesByLocation = useMemo(() => {
    const grouped: Record<string, NetworkDevice[]> = {};
    infrastructureDevices.forEach(device => {
      const location = device.location || 'Sin ubicación';
      if (!grouped[location]) grouped[location] = [];
      grouped[location].push(device);
    });
    return grouped;
  }, [infrastructureDevices]);

  // Count CPEs per location
  const cpeCountByLocation = useMemo(() => {
    const counts: Record<string, { total: number; online: number; offline: number }> = {};
    devices.filter(d => d.device_type === 'cpe').forEach(device => {
      const location = device.location || 'Sin ubicación';
      if (!counts[location]) counts[location] = { total: 0, online: 0, offline: 0 };
      counts[location].total++;
      if (device.status === 'online') counts[location].online++;
      if (device.status === 'offline') counts[location].offline++;
    });
    return counts;
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
      default: return Server;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'servidor': return 'Servidor';
      case 'nodo': return 'Nodo';
      case 'troncal': return 'Troncal';
      default: return type;
    }
  };

  // Get a main node for each location (for drill-down)
  const getMainNodeForLocation = (locationDevices: NetworkDevice[]) => {
    return locationDevices.find(d => d.device_type === 'nodo') || locationDevices[0];
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
            Infraestructura de Red
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
        <p className="text-sm text-muted-foreground">Haz clic en una ubicación para ver clientes y subdivisiones</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.keys(devicesByLocation).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay dispositivos de infraestructura</p>
        ) : (
          Object.entries(devicesByLocation).map(([location, locationDevices]) => {
            const mainNode = getMainNodeForLocation(locationDevices);
            const cpeStats = cpeCountByLocation[location] || { total: 0, online: 0, offline: 0 };
            const online = locationDevices.filter(d => d.status === 'online').length;
            const offline = locationDevices.filter(d => d.status === 'offline').length;
            
            return (
              <div 
                key={location} 
                className="border border-border/50 rounded-lg p-4 bg-secondary/5 hover:bg-secondary/10 transition-colors cursor-pointer group"
                onClick={() => onNodeDrillDown?.(mainNode)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <h4 className="font-semibold text-base">{location}</h4>
                      <p className="text-xs text-muted-foreground">
                        {locationDevices.length} dispositivos de infraestructura
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Infrastructure stats */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[hsl(var(--network-online))]">{online} online</span>
                      {offline > 0 && (
                        <span className="text-[hsl(var(--network-offline))]">{offline} offline</span>
                      )}
                    </div>
                    
                    {/* CPE stats */}
                    {cpeStats.total > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {cpeStats.total} clientes
                        {cpeStats.offline > 0 && (
                          <span className="text-[hsl(var(--network-offline))]">({cpeStats.offline} off)</span>
                        )}
                      </Badge>
                    )}
                    
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
                
                {/* Show infrastructure devices inline */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {locationDevices.map(device => {
                    const Icon = getDeviceIcon(device.device_type);
                    return (
                      <TooltipProvider key={device.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`flex items-center gap-2 px-2 py-1 rounded border ${getStatusColor(device.status)} ${
                                device.status === 'online' ? 'network-pulse' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeviceClick?.(device);
                              }}
                            >
                              <Icon className={`h-4 w-4 ${getIconColor(device.status)}`} />
                              <span className="text-xs font-medium">{device.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {getTypeLabel(device.device_type)}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-mono text-xs">{device.ip_address}</p>
                              <p className="text-xs">{device.description || 'Sin descripción'}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkTopologyMap;