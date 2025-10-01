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
    let successfulPings = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        console.log(`🏓 Ping intento ${i + 1}/${iterations}...`);
        const response = await fetch('https://speed.cloudflare.com/__down?bytes=0', { 
          cache: 'no-cache',
          mode: 'cors'
        });
        const end = performance.now();
        const pingTime = end - start;
        console.log(`✅ Ping ${i + 1}: ${pingTime.toFixed(2)}ms`);
        totalPing += pingTime;
        successfulPings++;
      } catch (error) {
        console.error(`❌ Ping ${i + 1} falló:`, error);
        totalPing += 100; // fallback if request fails
      }
    }

    const avgPing = successfulPings > 0 ? totalPing / iterations : 100;
    console.log(`📊 Ping promedio: ${avgPing.toFixed(2)}ms`);
    return avgPing;
  };

  // Measure download speed
  const measureDownload = async (): Promise<number> => {
    const fileSizeMB = 5; // 5MB test file - reduced for mobile
    const testUrl = `https://speed.cloudflare.com/__down?bytes=${fileSizeMB * 1024 * 1024}`;
    
    console.log(`📥 Descargando ${fileSizeMB}MB para medir velocidad...`);
    const start = performance.now();
    try {
      const response = await fetch(testUrl, { 
        cache: 'no-cache',
        mode: 'cors'
      });
      
      if (!response.ok) {
        console.error(`❌ Respuesta de descarga falló: ${response.status}`);
        return 0;
      }
      
      await response.arrayBuffer();
      const end = performance.now();
      
      const durationSeconds = (end - start) / 1000;
      const speedMbps = (fileSizeMB * 8) / durationSeconds; // Convert to Mbps
      
      console.log(`✅ Descarga completada en ${durationSeconds.toFixed(2)}s = ${speedMbps.toFixed(2)} Mbps`);
      return speedMbps;
    } catch (error) {
      console.error('❌ Test de descarga falló:', error);
      return 0;
    }
  };

  // Measure upload speed
  const measureUpload = async (): Promise<number> => {
    const fileSizeMB = 2; // 2MB test data - reduced for mobile
    console.log(`📤 Subiendo ${fileSizeMB}MB para medir velocidad...`);
    
    const testData = new ArrayBuffer(fileSizeMB * 1024 * 1024);
    const blob = new Blob([testData]);
    
    const start = performance.now();
    try {
      const response = await fetch('https://speed.cloudflare.com/__up', {
        method: 'POST',
        body: blob,
        cache: 'no-cache',
        mode: 'cors'
      });
      
      if (!response.ok) {
        console.error(`❌ Respuesta de subida falló: ${response.status}`);
        return 0;
      }
      
      const end = performance.now();
      
      const durationSeconds = (end - start) / 1000;
      const speedMbps = (fileSizeMB * 8) / durationSeconds; // Convert to Mbps
      
      console.log(`✅ Subida completada en ${durationSeconds.toFixed(2)}s = ${speedMbps.toFixed(2)} Mbps`);
      return speedMbps;
    } catch (error) {
      console.error('❌ Test de subida falló:', error);
      return 0;
    }
  };

  const runSpeedTest = async () => {
    console.log('🚀 Iniciando prueba de velocidad...');
    setIsRunning(true);
    setProgress(0);
    
    try {
      // Step 1: Measure Ping (0-33%)
      console.log('📊 Midiendo ping...');
      setProgress(10);
      const ping = await measurePing();
      console.log(`✅ Ping: ${ping}ms`);
      setResults(prev => ({ ...prev, ping: Math.round(ping) }));
      setProgress(33);
      
      // Step 2: Measure Download (33-66%)
      console.log('📥 Midiendo velocidad de descarga...');
      setProgress(40);
      const download = await measureDownload();
      console.log(`✅ Descarga: ${download} Mbps`);
      setResults(prev => ({ ...prev, download: Math.round(download * 10) / 10 }));
      setProgress(66);
      
      // Step 3: Measure Upload (66-100%)
      console.log('📤 Midiendo velocidad de subida...');
      setProgress(75);
      const upload = await measureUpload();
      console.log(`✅ Subida: ${upload} Mbps`);
      setResults(prev => ({ ...prev, upload: Math.round(upload * 10) / 10 }));
      setProgress(100);
      
      console.log('✅ Prueba de velocidad completada exitosamente');
      toast({
        title: "Prueba de velocidad completada",
        description: "Los resultados se han actualizado correctamente",
      });
    } catch (error) {
      console.error('❌ Error en la prueba de velocidad:', error);
      toast({
        title: "Error en la prueba",
        description: "No se pudo completar la prueba de velocidad. Revisa la consola para más detalles.",
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