import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Download, Upload, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SpeedTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState({
    download: 0,
    upload: 0,
    ping: 0
  });
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Measure ping latency using Cloudflare's endpoint
  const measurePing = async (): Promise<number> => {
    const iterations = 3;
    let totalPing = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await fetch('https://speed.cloudflare.com/__down?bytes=0', { 
          cache: 'no-cache'
        });
        const end = performance.now();
        totalPing += (end - start);
      } catch {
        totalPing += 100; // fallback if request fails
      }
    }

    return totalPing / iterations;
  };

  // Measure download speed
  const measureDownload = async (): Promise<number> => {
    const fileSizeMB = 10; // 10MB test file
    const testUrl = `https://speed.cloudflare.com/__down?bytes=${fileSizeMB * 1024 * 1024}`;
    
    const start = performance.now();
    try {
      const response = await fetch(testUrl, { cache: 'no-cache' });
      await response.arrayBuffer();
      const end = performance.now();
      
      const durationSeconds = (end - start) / 1000;
      const speedMbps = (fileSizeMB * 8) / durationSeconds; // Convert to Mbps
      
      return speedMbps;
    } catch (error) {
      console.error('Download test failed:', error);
      return 0;
    }
  };

  // Measure upload speed
  const measureUpload = async (): Promise<number> => {
    const fileSizeMB = 5; // 5MB test data
    const testData = new ArrayBuffer(fileSizeMB * 1024 * 1024);
    const blob = new Blob([testData]);
    
    const start = performance.now();
    try {
      await fetch('https://speed.cloudflare.com/__up', {
        method: 'POST',
        body: blob,
        cache: 'no-cache'
      });
      const end = performance.now();
      
      const durationSeconds = (end - start) / 1000;
      const speedMbps = (fileSizeMB * 8) / durationSeconds; // Convert to Mbps
      
      return speedMbps;
    } catch (error) {
      console.error('Upload test failed:', error);
      return 0;
    }
  };

  const runSpeedTest = async () => {
    setIsRunning(true);
    setProgress(0);
    
    try {
      // Step 1: Measure Ping (0-33%)
      setProgress(10);
      const ping = await measurePing();
      setResults(prev => ({ ...prev, ping: Math.round(ping) }));
      setProgress(33);
      
      // Step 2: Measure Download (33-66%)
      setProgress(40);
      const download = await measureDownload();
      setResults(prev => ({ ...prev, download: Math.round(download * 10) / 10 }));
      setProgress(66);
      
      // Step 3: Measure Upload (66-100%)
      setProgress(75);
      const upload = await measureUpload();
      setResults(prev => ({ ...prev, upload: Math.round(upload * 10) / 10 }));
      setProgress(100);
      
      toast({
        title: "Prueba de velocidad completada",
        description: "Los resultados se han actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error en la prueba",
        description: "No se pudo completar la prueba de velocidad",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
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