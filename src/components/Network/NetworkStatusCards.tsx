import { Card } from "@/components/ui/card";
import { Activity, Server, Clock } from "lucide-react";
import type { NetworkDevice } from "@/pages/NetworkManagement";

interface NetworkStatusCardsProps {
  devices: NetworkDevice[];
  isLoading: boolean;
}

const NetworkStatusCards = ({ devices, isLoading }: NetworkStatusCardsProps) => {
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;
  const maintenanceCount = devices.filter(d => d.status === 'maintenance').length;
  const totalCount = devices.length;
  
  const getNetworkStatus = () => {
    if (offlineCount === 0 && maintenanceCount === 0) return 'operational';
    if (offlineCount > totalCount * 0.3) return 'critical';
    return 'partial';
  };
  
  const networkStatus = getNetworkStatus();
  
  const lastCheck = devices.length > 0 
    ? new Date(Math.max(...devices.map(d => new Date(d.last_check || d.updated_at).getTime())))
    : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-6 animate-pulse bg-secondary/20">
            <div className="h-20"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Estado de la Red</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                networkStatus === 'operational' 
                  ? 'bg-[hsl(var(--network-online-bg))] text-[hsl(134,61%,30%)]'
                  : networkStatus === 'partial'
                  ? 'bg-[hsl(var(--network-maintenance-bg))] text-[hsl(45,100%,30%)]'
                  : 'bg-[hsl(var(--network-offline-bg))] text-[hsl(0,72%,35%)]'
              }`}>
                {networkStatus === 'operational' ? 'Operacional' : networkStatus === 'partial' ? 'Parcial' : 'Crítico'}
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${
            networkStatus === 'operational' 
              ? 'bg-[hsl(var(--network-online))]/20'
              : networkStatus === 'partial'
              ? 'bg-[hsl(var(--network-maintenance))]/20'
              : 'bg-[hsl(var(--network-offline))]/20'
          }`}>
            <Activity className={`h-5 w-5 ${
              networkStatus === 'operational' 
                ? 'text-[hsl(var(--network-online))]'
                : networkStatus === 'partial'
                ? 'text-[hsl(var(--network-maintenance))]'
                : 'text-[hsl(var(--network-offline))]'
            }`} />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Dispositivos</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{onlineCount}/{totalCount}</p>
              <p className="text-sm text-muted-foreground">
                {offlineCount > 0 && <span className="text-[hsl(var(--network-offline))]">{offlineCount} offline</span>}
                {offlineCount > 0 && maintenanceCount > 0 && ' · '}
                {maintenanceCount > 0 && <span className="text-[hsl(var(--network-maintenance))]">{maintenanceCount} mantenimiento</span>}
                {offlineCount === 0 && maintenanceCount === 0 && <span className="text-[hsl(var(--network-online))]">Todos online</span>}
              </p>
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Server className="h-5 w-5 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Última Verificación</p>
            <div className="space-y-1">
              <p className="text-lg font-bold text-foreground">
                {lastCheck ? lastCheck.toLocaleString('es-ES', { 
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground">Red 10.255.255.0/24</p>
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NetworkStatusCards;
