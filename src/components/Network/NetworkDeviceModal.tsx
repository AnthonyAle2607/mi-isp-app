import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Server, HardDrive, Radio, Router, Wifi, WifiOff, Wrench } from "lucide-react";
import type { NetworkDevice } from "@/pages/NetworkManagement";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface NetworkDeviceModalProps {
  device: NetworkDevice | null;
  onClose: () => void;
  onStatusChange: () => void;
}

const NetworkDeviceModal = ({ device, onClose, onStatusChange }: NetworkDeviceModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!device) return null;

  const getDeviceIcon = () => {
    switch (device.device_type) {
      case 'servidor': return Server;
      case 'nodo': return HardDrive;
      case 'troncal': return Radio;
      case 'cpe': return Router;
      default: return Server;
    }
  };

  const Icon = getDeviceIcon();

  const getStatusColor = () => {
    switch (device.status) {
      case 'online': return 'bg-[hsl(var(--network-online-bg))] text-[hsl(134,61%,25%)] border-[hsl(var(--network-online))]';
      case 'offline': return 'bg-[hsl(var(--network-offline-bg))] text-[hsl(0,72%,30%)] border-[hsl(var(--network-offline))]';
      case 'maintenance': return 'bg-[hsl(var(--network-maintenance-bg))] text-[hsl(45,100%,25%)] border-[hsl(var(--network-maintenance))]';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      servidor: 'Servidor',
      nodo: 'Nodo',
      troncal: 'Troncal',
      cpe: 'CPE'
    };
    return labels[device.device_type] || device.device_type;
  };

  const handleForceStatus = async (newStatus: 'online' | 'offline' | 'maintenance') => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('network_devices')
        .update({ 
          status: newStatus,
          last_check: new Date().toISOString()
        })
        .eq('id', device.id);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `${device.name} ahora está ${newStatus}`,
      });
      
      onStatusChange();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Simulated status history for demo
  const statusHistory = [
    { status: device.status, timestamp: device.last_check || device.updated_at },
    { status: 'online', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { status: 'online', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { status: 'maintenance', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { status: 'online', timestamp: new Date(Date.now() - 172800000).toISOString() },
  ];

  return (
    <Dialog open={!!device} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              device.status === 'online' ? 'bg-[hsl(var(--network-online))]/20' :
              device.status === 'offline' ? 'bg-[hsl(var(--network-offline))]/20' :
              'bg-[hsl(var(--network-maintenance))]/20'
            }`}>
              <Icon className={`h-5 w-5 ${
                device.status === 'online' ? 'text-[hsl(var(--network-online))]' :
                device.status === 'offline' ? 'text-[hsl(var(--network-offline))]' :
                'text-[hsl(var(--network-maintenance))]'
              }`} />
            </div>
            {device.name}
          </DialogTitle>
          <DialogDescription>
            Detalles y acciones del dispositivo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Dirección IP</p>
              <p className="font-mono font-medium">{device.ip_address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <Badge variant="outline">{getTypeLabel()}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado Actual</p>
              <Badge className={`${getStatusColor()} border`}>
                {device.status === 'online' ? 'Online' : device.status === 'offline' ? 'Offline' : 'Mantenimiento'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Verificación</p>
              <p className="text-sm">{formatDate(device.last_check)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Subred</p>
              <p className="font-mono text-sm">{device.subnet || 'Sin asignar'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ubicación</p>
              <p className="text-sm">{device.location || 'Sin asignar'}</p>
            </div>
          </div>

          {/* Description */}
          {device.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Descripción</p>
              <p className="text-sm bg-secondary/30 p-3 rounded-lg">{device.description}</p>
            </div>
          )}

          <Separator />

          {/* Status History */}
          <div>
            <p className="text-sm font-medium mb-3">Historial de Estados (últimos 5)</p>
            <div className="space-y-2">
              {statusHistory.map((entry, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    index === 0 ? 'bg-secondary/50' : 'bg-secondary/20'
                  }`}
                >
                  <Badge 
                    variant="outline" 
                    className={`${
                      entry.status === 'online' ? 'bg-[hsl(var(--network-online-bg))] text-[hsl(134,61%,25%)]' :
                      entry.status === 'offline' ? 'bg-[hsl(var(--network-offline-bg))] text-[hsl(0,72%,30%)]' :
                      'bg-[hsl(var(--network-maintenance-bg))] text-[hsl(45,100%,25%)]'
                    }`}
                  >
                    {entry.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div>
            <p className="text-sm font-medium mb-3">Acciones (Demo)</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="border-[hsl(var(--network-online))] text-[hsl(var(--network-online))] hover:bg-[hsl(var(--network-online))]/10"
                onClick={() => handleForceStatus('online')}
                disabled={isUpdating || device.status === 'online'}
              >
                <Wifi className="h-4 w-4 mr-2" />
                Forzar Online
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="border-[hsl(var(--network-offline))] text-[hsl(var(--network-offline))] hover:bg-[hsl(var(--network-offline))]/10"
                onClick={() => handleForceStatus('offline')}
                disabled={isUpdating || device.status === 'offline'}
              >
                <WifiOff className="h-4 w-4 mr-2" />
                Forzar Offline
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="border-[hsl(var(--network-maintenance))] text-[hsl(var(--network-maintenance))] hover:bg-[hsl(var(--network-maintenance))]/10"
                onClick={() => handleForceStatus('maintenance')}
                disabled={isUpdating || device.status === 'maintenance'}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Mantenimiento
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NetworkDeviceModal;
