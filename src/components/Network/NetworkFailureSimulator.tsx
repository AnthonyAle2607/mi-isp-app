import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap, RefreshCw, Server, Radio, Router, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface NetworkFailureSimulatorProps {
  onSimulate: () => void;
}

const NetworkFailureSimulator = ({ onSimulate }: NetworkFailureSimulatorProps) => {
  const [isSimulating, setIsSimulating] = useState<string | null>(null);

  const simulateLocationFailure = async (location: string) => {
    setIsSimulating('location');
    try {
      // Get devices by location
      const { data: devices, error } = await supabase
        .from('network_devices')
        .select('id')
        .eq('location', location);
      
      if (error) throw error;

      if (devices && devices.length > 0) {
        const deviceIds = devices.map(d => d.id);
        await supabase
          .from('network_devices')
          .update({ status: 'offline', last_check: new Date().toISOString() })
          .in('id', deviceIds);
        
        toast({
          title: "⚠️ Simulación Activada",
          description: `${devices.length} dispositivos en ${location} ahora están offline`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sin dispositivos",
          description: `No hay dispositivos configurados en ${location}`,
        });
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

  const simulateSubnetFailure = async () => {
    setIsSimulating('subnet');
    try {
      // Get a random subnet and fail all its devices
      const { data: devices } = await supabase
        .from('network_devices')
        .select('subnet')
        .not('subnet', 'is', null)
        .limit(1);
      
      if (devices && devices.length > 0 && devices[0].subnet) {
        const subnet = devices[0].subnet;
        await supabase
          .from('network_devices')
          .update({ status: 'offline', last_check: new Date().toISOString() })
          .eq('subnet', subnet);
        
        toast({
          title: "🔴 Caída de Subred",
          description: `Todos los dispositivos en ${subnet} están offline`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sin subredes",
          description: "No hay subredes configuradas",
        });
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
            onClick={() => simulateLocationFailure('Zona Norte')}
            disabled={isSimulating !== null}
          >
            <MapPin className={`h-4 w-4 mr-2 ${isSimulating === 'location' ? 'animate-spin' : ''}`} />
            Fallo Zona Norte
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={simulateSubnetFailure}
            disabled={isSimulating !== null}
          >
            <Router className={`h-4 w-4 mr-2 ${isSimulating === 'subnet' ? 'animate-spin' : ''}`} />
            Fallo Subred
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
