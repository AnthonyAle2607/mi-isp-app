import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Router, Server, HardDrive, Radio, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { NetworkDevice } from "@/pages/NetworkManagement";
import { useState, useMemo } from "react";

interface NetworkNodeDetailProps {
  node: NetworkDevice;
  allDevices: NetworkDevice[];
  onBack: () => void;
  onDeviceClick: (device: NetworkDevice) => void;
}

const NetworkNodeDetail = ({ node, allDevices, onBack, onDeviceClick }: NetworkNodeDetailProps) => {
  const [ipFilter, setIpFilter] = useState('');

  // Get all devices in the same location/zone as this node
  const zoneDevices = useMemo(() => {
    return allDevices.filter(d => 
      d.location === node.location && d.id !== node.id
    );
  }, [allDevices, node]);

  // Group by device type
  const devicesByType = useMemo(() => ({
    troncales: zoneDevices.filter(d => d.device_type === 'troncal'),
    nodos: zoneDevices.filter(d => d.device_type === 'nodo'),
    cpes: zoneDevices.filter(d => d.device_type === 'cpe'),
    servidores: zoneDevices.filter(d => d.device_type === 'servidor'),
  }), [zoneDevices]);

  // Filter by IP
  const filteredCPEs = useMemo(() => {
    if (!ipFilter) return devicesByType.cpes;
    return devicesByType.cpes.filter(d => 
      d.ip_address.includes(ipFilter) || 
      d.name.toLowerCase().includes(ipFilter.toLowerCase())
    );
  }, [devicesByType.cpes, ipFilter]);

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

  const stats = {
    total: zoneDevices.length,
    online: zoneDevices.filter(d => d.status === 'online').length,
    offline: zoneDevices.filter(d => d.status === 'offline').length,
    maintenance: zoneDevices.filter(d => d.status === 'maintenance').length,
    clients: devicesByType.cpes.length,
  };

  const DeviceCard = ({ device }: { device: NetworkDevice }) => {
    const Icon = getDeviceIcon(device.device_type);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`flex items-center gap-3 p-3 rounded-lg border-2 ${getStatusColor(device.status)} cursor-pointer hover:scale-[1.02] transition-all ${
                device.status === 'online' ? 'network-pulse' : device.status === 'offline' ? 'animate-pulse' : ''
              }`}
              onClick={() => onDeviceClick(device)}
            >
              <Icon className={`h-5 w-5 ${getIconColor(device.status)}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{device.name}</p>
                <p className="text-xs font-mono text-muted-foreground">{device.ip_address}</p>
              </div>
              <Badge variant="outline" className="text-xs capitalize">
                {device.status}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{device.description || 'Sin descripción'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const NodeIcon = getDeviceIcon(node.device_type);

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getStatusColor(node.status)}`}>
            <NodeIcon className={`h-6 w-6 ${getIconColor(node.status)}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold">{node.name}</h2>
            <p className="text-sm text-muted-foreground">{node.location} • {node.subnet}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total dispositivos</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold text-[hsl(var(--network-online))]">{stats.online}</div>
          <div className="text-xs text-muted-foreground">Online</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold text-[hsl(var(--network-offline))]">{stats.offline}</div>
          <div className="text-xs text-muted-foreground">Offline</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold text-[hsl(var(--network-maintenance))]">{stats.maintenance}</div>
          <div className="text-xs text-muted-foreground">Mantenimiento</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.clients}</div>
          </div>
          <div className="text-xs text-muted-foreground">Clientes</div>
        </Card>
      </div>

      {/* Infrastructure in this zone (if any) */}
      {(devicesByType.troncales.length > 0 || devicesByType.nodos.length > 0 || devicesByType.servidores.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Infraestructura en {node.location}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {devicesByType.servidores.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">SERVIDORES</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {devicesByType.servidores.map(device => (
                    <DeviceCard key={device.id} device={device} />
                  ))}
                </div>
              </div>
            )}
            {devicesByType.nodos.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">OTROS NODOS</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {devicesByType.nodos.map(device => (
                    <DeviceCard key={device.id} device={device} />
                  ))}
                </div>
              </div>
            )}
            {devicesByType.troncales.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">TRONCALES</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {devicesByType.troncales.map(device => (
                    <DeviceCard key={device.id} device={device} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Clients (CPEs) */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Router className="h-5 w-5" />
              Clientes ({filteredCPEs.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por IP o nombre..."
                value={ipFilter}
                onChange={(e) => setIpFilter(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCPEs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {ipFilter ? 'No se encontraron clientes con ese filtro' : 'No hay clientes en esta zona'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
              {filteredCPEs.map(device => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkNodeDetail;
