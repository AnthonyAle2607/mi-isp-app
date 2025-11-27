import { Card } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { NetworkDevice, StatusFilter } from "@/pages/NetworkManagement";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NetworkStatusCardsProps {
  devices: NetworkDevice[];
  isLoading: boolean;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
}

const NetworkStatusCards = ({ devices, isLoading, statusFilter, onStatusFilterChange }: NetworkStatusCardsProps) => {
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6 animate-pulse bg-secondary/20">
            <div className="h-20"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Network Status Card */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => onStatusFilterChange('all')}
            >
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
          </TooltipTrigger>
          <TooltipContent>
            <p>Click para mostrar todos los dispositivos</p>
          </TooltipContent>
        </Tooltip>

        {/* Online Devices Card */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${statusFilter === 'online' ? 'ring-2 ring-[hsl(var(--network-online))]' : ''}`}
              onClick={() => onStatusFilterChange('online')}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Dispositivos Online</p>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
                    <p className="text-sm text-[hsl(var(--network-online))]">
                      {totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0}% del total
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-[hsl(var(--network-online))]/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--network-online))] network-pulse" />
                </div>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click para filtrar dispositivos online</p>
          </TooltipContent>
        </Tooltip>

        {/* Offline Devices Card */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${statusFilter === 'offline' ? 'ring-2 ring-[hsl(var(--network-offline))]' : ''}`}
              onClick={() => onStatusFilterChange('offline')}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Dispositivos Offline</p>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-foreground">{offlineCount}</p>
                    <p className="text-sm text-[hsl(var(--network-offline))]">
                      {offlineCount > 0 ? 'Requiere atención' : 'Todo operativo'}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-[hsl(var(--network-offline))]/20 rounded-lg">
                  <AlertTriangle className={`h-5 w-5 text-[hsl(var(--network-offline))] ${offlineCount > 0 ? 'animate-pulse' : ''}`} />
                </div>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click para filtrar dispositivos offline</p>
          </TooltipContent>
        </Tooltip>

        {/* Maintenance Card */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${statusFilter === 'maintenance' ? 'ring-2 ring-[hsl(var(--network-maintenance))]' : ''}`}
              onClick={() => onStatusFilterChange('maintenance')}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">En Mantenimiento</p>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-foreground">{maintenanceCount}</p>
                    <p className="text-sm text-muted-foreground">
                      {lastCheck ? lastCheck.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-[hsl(var(--network-maintenance))]/20 rounded-lg">
                  <Clock className="h-5 w-5 text-[hsl(var(--network-maintenance))]" />
                </div>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click para filtrar dispositivos en mantenimiento</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default NetworkStatusCards;
