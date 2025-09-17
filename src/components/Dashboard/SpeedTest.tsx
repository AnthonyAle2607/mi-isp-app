import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Download, Upload, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SpeedTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState({
    download: 87.5,
    upload: 45.2,
    ping: 12
  });
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runSpeedTest = () => {
    setIsRunning(true);
    setProgress(0);
    
    // Simulate speed test
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          setResults({
            download: Math.random() * 50 + 50,
            upload: Math.random() * 30 + 20,
            ping: Math.random() * 20 + 5
          });
          toast({
            title: "Prueba de velocidad completada",
            description: "Los resultados se han actualizado correctamente",
          });
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gauge className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Prueba de Velocidad</h3>
              <p className="text-sm text-muted-foreground">Mide tu velocidad de conexión actual</p>
            </div>
          </div>
          <Button
            onClick={runSpeedTest}
            disabled={isRunning}
            className="bg-gradient-to-r from-primary to-tech-blue-dark hover:from-tech-blue-dark hover:to-primary"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isRunning ? "Probando..." : "Iniciar Prueba"}
          </Button>
        </div>

        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-secondary/30 rounded-lg">
            <Download className="h-6 w-6 text-success-green mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Descarga</p>
            <p className="text-xl font-bold text-foreground">{results.download.toFixed(1)} Mbps</p>
          </div>
          
          <div className="text-center p-4 bg-secondary/30 rounded-lg">
            <Upload className="h-6 w-6 text-warning-orange mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Subida</p>
            <p className="text-xl font-bold text-foreground">{results.upload.toFixed(1)} Mbps</p>
          </div>
          
          <div className="text-center p-4 bg-secondary/30 rounded-lg">
            <Zap className="h-6 w-6 text-tech-blue mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Ping</p>
            <p className="text-xl font-bold text-foreground">{results.ping.toFixed(0)} ms</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SpeedTest;