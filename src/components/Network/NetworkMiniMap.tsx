import { Card } from "@/components/ui/card";
import { Network, MapPin } from "lucide-react";
import type { NetworkDevice } from "@/pages/NetworkManagement";
import { useMemo } from "react";

interface NetworkMiniMapProps {
  devices: NetworkDevice[];
  currentLocation: string | null;
  onLocationClick: (location: string) => void;
}

const NetworkMiniMap = ({ devices, currentLocation, onLocationClick }: NetworkMiniMapProps) => {
  const locationStats = useMemo(() => {
    const stats: Record<string, { total: number; online: number; offline: number; hasNode: boolean }> = {};
    
    devices.forEach(device => {
      const loc = device.location || 'Sin ubicación';
      if (!stats[loc]) {
        stats[loc] = { total: 0, online: 0, offline: 0, hasNode: false };
      }
      stats[loc].total++;
      if (device.status === 'online') stats[loc].online++;
      if (device.status === 'offline') stats[loc].offline++;
      if (device.device_type === 'nodo') stats[loc].hasNode = true;
    });
    
    return stats;
  }, [devices]);

  const getLocationColor = (location: string) => {
    const stat = locationStats[location];
    if (!stat) return 'bg-muted';
    if (stat.offline > 0) return 'bg-[hsl(var(--network-offline-bg))] border-[hsl(var(--network-offline))]';
    return 'bg-[hsl(var(--network-online-bg))] border-[hsl(var(--network-online))]';
  };

  return (
    <Card className="p-3 bg-card/50 backdrop-blur border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Network className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Mini-mapa</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(locationStats).map(([location, stats]) => {
          const isActive = currentLocation === location;
          
          return (
            <button
              key={location}
              onClick={() => onLocationClick(location)}
              className={`
                relative p-2 rounded-md border-2 transition-all text-left
                ${getLocationColor(location)}
                ${isActive 
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-105' 
                  : 'hover:scale-[1.02] opacity-70 hover:opacity-100'
                }
              `}
            >
              {isActive && (
                <MapPin className="absolute -top-1 -right-1 h-4 w-4 text-primary fill-primary" />
              )}
              <p className="text-[10px] font-semibold truncate text-foreground">{location}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] text-[hsl(var(--network-online))]">{stats.online}</span>
                <span className="text-[9px] text-muted-foreground">/</span>
                <span className="text-[9px] text-[hsl(var(--network-offline))]">{stats.offline}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default NetworkMiniMap;
