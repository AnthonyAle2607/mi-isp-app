import { Card } from "@/components/ui/card";
import { Gauge } from "lucide-react";

const SpeedTest = () => {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Gauge className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Prueba de Velocidad</h3>
            <p className="text-sm text-muted-foreground">Mide tu velocidad de conexión actual</p>
          </div>
        </div>

        <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border/50">
          <iframe
            src="https://www.nperf.com/es/"
            className="w-full h-full"
            title="Test de Velocidad nPerf"
            allow="geolocation"
          />
        </div>
      </div>
    </Card>
  );
};

export default SpeedTest;