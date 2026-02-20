import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Download, Upload, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type TestPhase = 'idle' | 'ping' | 'download' | 'upload' | 'complete';

interface SpeedTestProps {
  onTestComplete?: (downloadSpeed: number) => void;
}

const SpeedTest = ({ onTestComplete }: SpeedTestProps = {}) => {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({
    download: 0,
    upload: 0,
    ping: 0
  });
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Animated needle rotation (0-270 degrees)
  const getNeedleRotation = () => {
    const maxSpeed = 500; // Scale max
    const percentage = Math.min(currentSpeed / maxSpeed, 1);
    return -135 + (percentage * 270); // Start at -135deg, end at 135deg
  };

  const measurePing = useCallback(async (): Promise<number> => {
    const iterations = 5;
    let totalPing = 0;
    let successfulPings = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch('https://speed.cloudflare.com/__down?bytes=0', { 
          method: 'GET',
          cache: 'no-cache',
          mode: 'cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const end = performance.now();
        totalPing += end - start;
        successfulPings++;
      } catch {
        // Skip failed ping
      }
    }

    return successfulPings > 0 ? totalPing / successfulPings : 100;
  }, []);

  const measureDownload = useCallback(async (): Promise<number> => {
    const testDuration = 10000; // 10 seconds
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks
    const startTime = performance.now();
    let totalBytes = 0;
    const speedSamples: number[] = [];

    abortControllerRef.current = new AbortController();

    try {
      while (performance.now() - startTime < testDuration) {
        const chunkStart = performance.now();
        
        try {
          const response = await fetch(`https://speed.cloudflare.com/__down?bytes=${chunkSize}`, {
            method: 'GET',
            cache: 'no-cache',
            mode: 'cors',
            signal: abortControllerRef.current.signal
          });

          if (!response.ok) continue;
          await response.arrayBuffer();

          const chunkEnd = performance.now();
          totalBytes += chunkSize;
          
          const duration = (chunkEnd - chunkStart) / 1000;
          const speedMbps = (chunkSize * 8) / (duration * 1000000);
          
          speedSamples.push(speedMbps);
          setCurrentSpeed(speedMbps);
          
          // Update progress (download is 33-66%)
          const elapsed = performance.now() - startTime;
          setProgress(33 + (elapsed / testDuration) * 33);
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') break;
        }
      }
    } catch {
      // Test interrupted
    }

    // Calculate trimmed mean
    if (speedSamples.length > 5) {
      const sorted = [...speedSamples].sort((a, b) => a - b);
      const trimCount = Math.floor(sorted.length * 0.1);
      const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
      return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    }
    
    return speedSamples.length > 0 
      ? speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length 
      : 0;
  }, []);

  const measureUpload = useCallback(async (): Promise<number> => {
    const testDuration = 10000; // 10 seconds
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks
    const startTime = performance.now();
    const speedSamples: number[] = [];

    abortControllerRef.current = new AbortController();
    const testData = new ArrayBuffer(chunkSize);
    const blob = new Blob([testData]);

    try {
      while (performance.now() - startTime < testDuration) {
        const chunkStart = performance.now();
        
        try {
          await fetch('https://speed.cloudflare.com/__up', {
            method: 'POST',
            body: blob,
            cache: 'no-cache',
            mode: 'cors',
            signal: abortControllerRef.current.signal
          });

          const chunkEnd = performance.now();
          
          const duration = (chunkEnd - chunkStart) / 1000;
          const speedMbps = (chunkSize * 8) / (duration * 1000000);
          
          speedSamples.push(speedMbps);
          setCurrentSpeed(speedMbps);
          
          // Update progress (upload is 66-100%)
          const elapsed = performance.now() - startTime;
          setProgress(66 + (elapsed / testDuration) * 34);
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') break;
        }
      }
    } catch {
      // Test interrupted
    }

    // Calculate trimmed mean
    if (speedSamples.length > 5) {
      const sorted = [...speedSamples].sort((a, b) => a - b);
      const trimCount = Math.floor(sorted.length * 0.1);
      const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
      return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    }
    
    return speedSamples.length > 0 
      ? speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length 
      : 0;
  }, []);

  const runSpeedTest = async () => {
    setPhase('ping');
    setResults({ download: 0, upload: 0, ping: 0 });
    setCurrentSpeed(0);
    setProgress(0);

    try {
      // Measure ping (0-33%)
      setProgress(10);
      const ping = await measurePing();
      setResults(prev => ({ ...prev, ping: Math.round(ping) }));
      setProgress(33);

      // Measure download (33-66%)
      setPhase('download');
      const download = await measureDownload();
      setResults(prev => ({ ...prev, download: Math.round(download * 10) / 10 }));
      setCurrentSpeed(0);
      setProgress(66);

      // Measure upload (66-100%)
      setPhase('upload');
      const upload = await measureUpload();
      setResults(prev => ({ ...prev, upload: Math.round(upload * 10) / 10 }));
      setProgress(100);

      setPhase('complete');
      
      // Call callback with download speed
      onTestComplete?.(download);
      
      toast({
        title: "Prueba completada",
        description: `↓ ${download.toFixed(1)} Mbps | ↑ ${upload.toFixed(1)} Mbps | ${Math.round(ping)} ms`,
      });
    } catch (error) {
      console.error('Speed test error:', error);
      setPhase('idle');
      toast({
        title: "Error en la prueba",
        description: "No se pudo completar la prueba de velocidad",
        variant: "destructive"
      });
    }
  };

  const stopTest = () => {
    abortControllerRef.current?.abort();
    setPhase('idle');
    setProgress(0);
    setCurrentSpeed(0);
  };

  const isRunning = phase !== 'idle' && phase !== 'complete';

  // Speed gauge color based on value
  const getSpeedColor = () => {
    if (currentSpeed < 10) return '#ef4444'; // red
    if (currentSpeed < 30) return '#f97316'; // orange
    if (currentSpeed < 50) return '#eab308'; // yellow
    if (currentSpeed < 100) return '#22c55e'; // green
    return '#06b6d4'; // cyan for high speeds
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Prueba de Velocidad</h3>
              <p className="text-sm text-muted-foreground">Servidor: Cloudflare (Global CDN)</p>
            </div>
          </div>
        </div>

        {/* Speed Gauge */}
        <div className="flex justify-center py-4">
          <div className="relative w-64 h-40">
            {/* Gauge background */}
            <svg viewBox="0 0 200 120" className="w-full h-full">
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="12"
                strokeLinecap="round"
              />
              
              {/* Colored segments */}
              <path
                d="M 20 100 A 80 80 0 0 1 50 40"
                fill="none"
                stroke="#ef4444"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 50 40 A 80 80 0 0 1 100 20"
                fill="none"
                stroke="#f97316"
                strokeWidth="12"
              />
              <path
                d="M 100 20 A 80 80 0 0 1 150 40"
                fill="none"
                stroke="#22c55e"
                strokeWidth="12"
              />
              <path
                d="M 150 40 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="12"
                strokeLinecap="round"
              />

              {/* Needle */}
              <g transform={`rotate(${getNeedleRotation()}, 100, 100)`}>
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="35"
                  stroke={getSpeedColor()}
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-transform duration-200"
                />
                <circle cx="100" cy="100" r="8" fill={getSpeedColor()} />
                <circle cx="100" cy="100" r="4" fill="hsl(var(--card))" />
              </g>

              {/* Labels */}
              <text x="25" y="115" fill="hsl(var(--muted-foreground))" fontSize="10">0</text>
              <text x="95" y="18" fill="hsl(var(--muted-foreground))" fontSize="10">250</text>
              <text x="170" y="115" fill="hsl(var(--muted-foreground))" fontSize="10">500</text>
            </svg>

            {/* Speed display */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
              <span 
                className="text-4xl font-bold transition-colors duration-200"
                style={{ color: getSpeedColor() }}
              >
                {currentSpeed.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">Mb/s</span>
              <span className="text-xs text-muted-foreground mt-1">
                {phase === 'idle' ? 'Listo' :
                 phase === 'ping' ? 'Midiendo latencia...' :
                 phase === 'download' ? 'Descargando...' :
                 phase === 'upload' ? 'Subiendo...' :
                 'Completado'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ping</span>
              <span>Descarga</span>
              <span>Subida</span>
            </div>
          </div>
        )}

        {/* Start/Stop button */}
        <div className="flex justify-center">
          <Button
            onClick={isRunning ? stopTest : runSpeedTest}
            size="lg"
            className={`px-8 ${
              isRunning 
                ? 'bg-destructive hover:bg-destructive/90' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            <Zap className="h-4 w-4 mr-2" />
            {isRunning ? 'Detener' : 'Iniciar Prueba'}
          </Button>
        </div>

        {/* Results */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-secondary/30 rounded-lg border border-border">
            <Download className="h-5 w-5 text-success-green mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Descarga</p>
            <p className="text-xl font-bold text-foreground">{results.download.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Mbps</p>
          </div>
          
          <div className="text-center p-4 bg-secondary/30 rounded-lg border border-border">
            <Upload className="h-5 w-5 text-warning-orange mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Subida</p>
            <p className="text-xl font-bold text-foreground">{results.upload.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Mbps</p>
          </div>
          
          <div className="text-center p-4 bg-secondary/30 rounded-lg border border-border">
            <Activity className="h-5 w-5 text-tech-blue mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Ping</p>
            <p className="text-xl font-bold text-foreground">{results.ping}</p>
            <p className="text-xs text-muted-foreground">ms</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedTest;
