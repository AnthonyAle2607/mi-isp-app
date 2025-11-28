import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { NetworkDevice } from "@/pages/NetworkManagement";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NetworkDevicesTableProps {
  devices: NetworkDevice[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeviceClick: (device: NetworkDevice) => void;
  sortColumn: keyof NetworkDevice;
  sortDirection: 'asc' | 'desc';
  onSort: (column: keyof NetworkDevice) => void;
}

const NetworkDevicesTable = ({ 
  devices, 
  isLoading, 
  onRefresh, 
  onDeviceClick,
  sortColumn,
  sortDirection,
  onSort 
}: NetworkDevicesTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[hsl(var(--network-online-bg))] text-[hsl(134,61%,25%)] network-pulse">
            Online
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[hsl(var(--network-offline-bg))] text-[hsl(0,72%,30%)] animate-pulse">
            Offline
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[hsl(var(--network-maintenance-bg))] text-[hsl(45,100%,25%)]">
            Mantenimiento
          </span>
        );
      default:
        return <span className="text-muted-foreground">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      servidor: 'Servidor',
      nodo: 'Nodo',
      troncal: 'Troncal',
      cpe: 'CPE'
    };
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
        {typeLabels[type] || type}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const SortIcon = ({ column }: { column: keyof NetworkDevice }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const SortableHeader = ({ column, children }: { column: keyof NetworkDevice; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-secondary/50 transition-colors select-none"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center">
        {children}
        <SortIcon column={column} />
      </div>
    </TableHead>
  );

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">
          Dispositivos de Red
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({devices.length} dispositivos)
          </span>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader column="name">Nombre</SortableHeader>
                  <SortableHeader column="ip_address">Dirección IP</SortableHeader>
                  <SortableHeader column="subnet">Subred</SortableHeader>
                  <SortableHeader column="location">Ubicación</SortableHeader>
                  <SortableHeader column="device_type">Tipo</SortableHeader>
                  <SortableHeader column="status">Estado</SortableHeader>
                  <TableHead className="hidden lg:table-cell">Descripción</TableHead>
                  <SortableHeader column="last_check">Última Verificación</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <div className="h-8 bg-secondary/20 animate-pulse rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No hay dispositivos que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map(device => (
                    <Tooltip key={device.id}>
                      <TooltipTrigger asChild>
                        <TableRow 
                          className="cursor-pointer hover:bg-secondary/30 transition-all hover:scale-[1.01]"
                          onClick={() => onDeviceClick(device)}
                        >
                          <TableCell className="font-medium">{device.name}</TableCell>
                          <TableCell className="font-mono text-sm">{device.ip_address}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{device.subnet || '-'}</TableCell>
                          <TableCell className="text-sm">{device.location || '-'}</TableCell>
                          <TableCell>{getTypeBadge(device.device_type)}</TableCell>
                          <TableCell>{getStatusBadge(device.status)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                            {device.description || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(device.last_check)}
                          </TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Click para ver detalles de {device.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default NetworkDevicesTable;
