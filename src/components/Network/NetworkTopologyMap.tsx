import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, HardDrive, Radio, Router } from "lucide-react";
import type { NetworkDevice } from "@/pages/NetworkManagement";

interface NetworkTopologyMapProps {
  devices: NetworkDevice[];
  isLoading: boolean;
}

const NetworkTopologyMap = ({ devices, isLoading }: NetworkTopologyMapProps) => {
  const servidores = devices.filter(d => d.device_type === 'servidor');
  const nodos = devices.filter(d => d.device_type === 'nodo');
  const troncales = devices.filter(d => d.device_type === 'troncal');
  const cpes = devices.filter(d => d.device_type === 'cpe');

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

  const DeviceNode = ({ device, icon: Icon }: { device: NetworkDevice; icon: React.ElementType }) => (
    <div 
      className={`flex flex-col items-center p-2 rounded-lg border-2 ${getStatusColor(device.status)} transition-all hover:scale-105`}
      title={`${device.name}\n${device.ip_address}\n${device.description || ''}`}
    >
      <Icon className={`h-5 w-5 ${getIconColor(device.status)}`} />
      <span className="text-[10px] font-mono mt-1 text-foreground/80 truncate max-w-[80px]">
        {device.ip_address.split('.').pop()}
      </span>
    </div>
  );

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Topología de Red - 10.255.255.0/24</CardTitle>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[hsl(var(--network-online-bg))] border border-[hsl(var(--network-online))]"></span>
              Online
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[hsl(var(--network-offline-bg))] border border-[hsl(var(--network-offline))]"></span>
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
        <div className="relative py-4">
          {/* Servidores - Nivel 1 */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2 font-medium">SERVIDORES (10.255.255.1-9)</p>
            <div className="flex flex-wrap gap-3 justify-center bg-secondary/10 rounded-lg p-4">
              {servidores.map(device => (
                <DeviceNode key={device.id} device={device} icon={Server} />
              ))}
              {servidores.length === 0 && <span className="text-muted-foreground text-sm">Sin servidores</span>}
            </div>
          </div>

          {/* Línea conectora */}
          <div className="flex justify-center mb-2">
            <div className="w-0.5 h-6 bg-border"></div>
          </div>

          {/* Nodos - Nivel 2 */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2 font-medium">NODOS (10.255.255.10-49)</p>
            <div className="flex flex-wrap gap-3 justify-center bg-secondary/10 rounded-lg p-4">
              {nodos.map(device => (
                <DeviceNode key={device.id} device={device} icon={HardDrive} />
              ))}
              {nodos.length === 0 && <span className="text-muted-foreground text-sm">Sin nodos</span>}
            </div>
          </div>

          {/* Línea conectora */}
          <div className="flex justify-center mb-2">
            <div className="w-0.5 h-6 bg-border"></div>
          </div>

          {/* Troncales - Nivel 3 */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2 font-medium">TRONCALES (10.255.255.50-79)</p>
            <div className="flex flex-wrap gap-3 justify-center bg-secondary/10 rounded-lg p-4">
              {troncales.map(device => (
                <DeviceNode key={device.id} device={device} icon={Radio} />
              ))}
              {troncales.length === 0 && <span className="text-muted-foreground text-sm">Sin troncales</span>}
            </div>
          </div>

          {/* Línea conectora */}
          <div className="flex justify-center mb-2">
            <div className="w-0.5 h-6 bg-border"></div>
          </div>

          {/* CPEs - Nivel 4 */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">CPEs (10.255.255.100-254)</p>
            <div className="flex flex-wrap gap-3 justify-center bg-secondary/10 rounded-lg p-4 max-h-32 overflow-y-auto">
              {cpes.map(device => (
                <DeviceNode key={device.id} device={device} icon={Router} />
              ))}
              {cpes.length === 0 && <span className="text-muted-foreground text-sm">Sin CPEs</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkTopologyMap;
