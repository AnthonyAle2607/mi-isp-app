import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap, RefreshCw, Server, Radio, Router } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface NetworkFailureSimulatorProps {
  onSimulate: () => void;
}

const NetworkFailureSimulator = ({ onSimulate }: NetworkFailureSimulatorProps) => {
  const [isSimulating, setIsSimulating] = useState<string | null>(null);

  const simulateZoneFailure = async () => {
    setIsSimulating('zone');
    try {
      // Get CPEs with IPs 10.255.255.100-150
      const { data: cpes } = await supabase
        .from('network_devices')
        .select('id, ip_address')
        .eq('device_type', 'cpe');
      
      if (cpes && cpes.length > 0) {
        const cpeIds = cpes
          .filter(c => {
            const lastOctet = parseInt(c.ip_address.split('.')[3]);
            return lastOctet >= 100 && lastOctet <= 150;
          })
          .map(c => c.id);
        
        if (cpeIds.length > 0) {
          await supabase
            .from('network_devices')
            .update({ status: 'offline', last_check: new Date().toISOString() })
            .in('id', cpeIds);
          
          toast({
            title: "⚠️ Simulación Activada",
            description: `${cpeIds.length} CPEs en Zona Norte ahora están offline`,
            variant: "destructive",
          });
        }
      }
      onSimulate();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo simular la falla",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(null);
    }
  };

  const simulateTroncalFailure = async () => {
    setIsSimulating('troncal');
    try {
      const { error } = await supabase
        .from('network_devices')
        .update({ status: 'offline', last_check: new Date().toISOString() })
        .eq('device_type', 'troncal');

      if (error) throw error;

      toast({
        title: "🔴 Caída de Troncales",
        description: "Todos los troncales están ahora offline",
        variant: "destructive",
      });
      onSimulate();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo simular la falla",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(null);
    }
  };

  const simulateServerFailure = async () => {
    setIsSimulating('server');
    try {
      const { error } = await supabase
        .from('network_devices')
        .update({ status: 'offline', last_check: new Date().toISOString() })
        .eq('device_type', 'servidor');

      if (error) throw error;

      toast({
        title: "🔴 Caída de Servidores",
        description: "Todos los servidores están ahora offline",
        variant: "destructive",
      });
      onSimulate();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo simular la falla",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(null);
    }
  };

  const recoverAll = async () => {
    setIsSimulating('recover');
    try {
      const { error } = await supabase
        .from('network_devices')
        .update({ status: 'online', last_check: new Date().toISOString() })
        .neq('status', 'maintenance');

      if (error) throw error;

      toast({
        title: "✅ Recuperación Completa",
        description: "Todos los dispositivos están ahora online",
      });
      onSimulate();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo recuperar los dispositivos",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(null);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card to-destructive/5 border-destructive/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-destructive" />
          Simulador de Fallos (Demo)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={simulateZoneFailure}
            disabled={isSimulating !== null}
          >
            <Router className={`h-4 w-4 mr-2 ${isSimulating === 'zone' ? 'animate-spin' : ''}`} />
            Fallo Zona Norte (CPEs)
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={simulateTroncalFailure}
            disabled={isSimulating !== null}
          >
            <Radio className={`h-4 w-4 mr-2 ${isSimulating === 'troncal' ? 'animate-spin' : ''}`} />
            Caída de Troncales
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={simulateServerFailure}
            disabled={isSimulating !== null}
          >
            <Server className={`h-4 w-4 mr-2 ${isSimulating === 'server' ? 'animate-spin' : ''}`} />
            Caída de Servidores
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="border-[hsl(var(--network-online))]/50 text-[hsl(var(--network-online))] hover:bg-[hsl(var(--network-online))]/10"
            onClick={recoverAll}
            disabled={isSimulating !== null}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSimulating === 'recover' ? 'animate-spin' : ''}`} />
            Recuperar Todo
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <AlertTriangle className="h-3 w-3 inline mr-1" />
          Estas acciones modifican datos reales en la base de datos para propósitos de demostración
        </p>
      </CardContent>
    </Card>
  );
};

export default NetworkFailureSimulator;
