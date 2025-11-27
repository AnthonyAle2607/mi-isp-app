import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { NetworkDevice } from "@/pages/NetworkManagement";

interface NetworkDevicesTableProps {
  devices: NetworkDevice[];
  isLoading: boolean;
  onRefresh: () => void;
}

const NetworkDevicesTable = ({ devices, isLoading, onRefresh }: NetworkDevicesTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[hsl(var(--network-online-bg))] text-[hsl(134,61%,25%)]">
            Online
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[hsl(var(--network-offline-bg))] text-[hsl(0,72%,30%)]">
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

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Dispositivos de Red</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onRefresh()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección IP</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead className="hidden lg:table-cell">Última Verificación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <div className="h-8 bg-secondary/20 animate-pulse rounded"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay dispositivos registrados
                  </TableCell>
                </TableRow>
              ) : (
                devices.map(device => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell className="font-mono text-sm">{device.ip_address}</TableCell>
                    <TableCell>{getTypeBadge(device.device_type)}</TableCell>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                      {device.description || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {formatDate(device.last_check)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkDevicesTable;
