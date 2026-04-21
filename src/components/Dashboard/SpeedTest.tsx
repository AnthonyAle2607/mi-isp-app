import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Activity, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TestPhase = 'idle' | 'ping' | 'download' | 'upload' | 'complete';

interface SpeedTestProps {
  onTestComplete?: (downloadSpeed: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

const SpeedTest = ({ onTestComplete }: SpeedTestProps = {}) => {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ download: 0, upload: 0, ping: 0 });
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const speedRef = useRef(0);
  const phaseRef = useRef<TestPhase>('idle');

  useEffect(() => { speedRef.current = currentSpeed; }, [currentSpeed]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = () => canvas.width / 2;
    const h = () => canvas.height / 2;
    const getSpeedIntensity = () => Math.min(speedRef.current / 200, 1);
    
    const getHueForSpeed = (speed: number) => {
      if (speed < 10) return 220;
      if (speed < 30) return 180;
      if (speed < 80) return 140;
      if (speed < 150) return 50;
      return 15;
    };

    const spawnParticles = (count: number) => {
      const cx = w() / 2;
      const cy = h() / 2;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 2 * (0.3 + getSpeedIntensity() * 2);
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 60 + Math.random() * 120,
          size: 1 + Math.random() * 2.5 * (0.5 + getSpeedIntensity()),
          hue: getHueForSpeed(speedRef.current) + (Math.random() - 0.5) * 30
        });
      }
    };

    const animate = () => {
      const width = w();
      const height = h();
      const cx = width / 2;
      const cy = height / 2;
      const intensity = getSpeedIntensity();
      const isRunning = phaseRef.current !== 'idle' && phaseRef.current !== 'complete';
      const isComplete = phaseRef.current === 'complete';

      ctx.fillStyle = 'rgba(10, 12, 20, 0.15)';
      ctx.fillRect(0, 0, width, height);

      const glowRadius = 40 + intensity * 60;
      const hue = getHueForSpeed(speedRef.current);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      
      if (isRunning) {
        grad.addColorStop(0, `hsla(${hue}, 80%, 60%, ${0.3 + intensity * 0.4})`);
        grad.addColorStop(0.5, `hsla(${hue}, 70%, 40%, ${0.1 + intensity * 0.15})`);
        grad.addColorStop(1, 'transparent');
      } else if (isComplete) {
        grad.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.25)`);
        grad.addColorStop(0.5, `hsla(${hue}, 60%, 35%, 0.08)`);
        grad.addColorStop(1, 'transparent');
      } else {
        grad.addColorStop(0, 'hsla(220, 60%, 40%, 0.12)');
        grad.addColorStop(0.5, 'hsla(260, 50%, 30%, 0.05)');
        grad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      if (isRunning) {
        spawnParticles(Math.floor(2 + intensity * 8));
      } else if (isComplete) {
        if (Math.random() < 0.3) spawnParticles(1);
      } else {
        if (Math.random() < 0.15) spawnParticles(1);
      }

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.995; p.vy *= 0.995;
        p.life -= 1 / p.maxLife;
        if (p.life <= 0) return false;
        const alpha = p.life * (0.4 + intensity * 0.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${alpha})`;
        ctx.fill();
        if (p.size > 1.5 && isRunning) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 70%, 50%, ${alpha * 0.1})`;
          ctx.fill();
        }
        return true;
      });

      if (isRunning) {
        const time = Date.now() / 1000;
        for (let i = 0; i < 2; i++) {
          const ringRadius = 50 + i * 30 + intensity * 20;
          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius, time * (1 + i * 0.5), time * (1 + i * 0.5) + Math.PI * (0.5 + intensity * 0.8));
          ctx.strokeStyle = `hsla(${hue + i * 30}, 60%, 55%, ${0.15 + intensity * 0.2})`;
          ctx.lineWidth = 1 + intensity;
          ctx.stroke();
        }
      }

      if (phaseRef.current === 'ping') {
        const time = Date.now() / 300;
        for (let i = 0; i < 3; i++) {
          const r = ((time + i * 2) % 6) * 15;
          const alpha = 1 - r / 90;
          if (alpha > 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(200, 70%, 60%, ${alpha * 0.4})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const measurePing = useCallback(async (): Promise<number> => {
    const iterations = 5;
    let totalPing = 0;
    let successfulPings = 0;
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        await fetch('https://speed.cloudflare.com/__down?bytes=0', { method: 'GET', cache: 'no-cache', mode: 'cors', signal: controller.signal });
        clearTimeout(timeoutId);
        totalPing += performance.now() - start;
        successfulPings++;
      } catch { /* skip */ }
    }
    return successfulPings > 0 ? totalPing / successfulPings : 100;
  }, []);

  const measureDownload = useCallback(async (): Promise<number> => {
    const testDuration = 10000;
    const chunkSize = 10 * 1024 * 1024;
    const startTime = performance.now();
    const speedSamples: number[] = [];
    abortControllerRef.current = new AbortController();
    try {
      while (performance.now() - startTime < testDuration) {
        const chunkStart = performance.now();
        try {
          const response = await fetch(`https://speed.cloudflare.com/__down?bytes=${chunkSize}`, { method: 'GET', cache: 'no-cache', mode: 'cors', signal: abortControllerRef.current.signal });
          if (!response.ok) continue;
          await response.arrayBuffer();
          const duration = (performance.now() - chunkStart) / 1000;
          const speedMbps = (chunkSize * 8) / (duration * 1000000);
          speedSamples.push(speedMbps);
          setCurrentSpeed(speedMbps);
          const elapsed = performance.now() - startTime;
          setProgress(33 + (elapsed / testDuration) * 33);
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') break;
        }
      }
    } catch { /* interrupted */ }
    if (speedSamples.length > 5) {
      const sorted = [...speedSamples].sort((a, b) => a - b);
      const trimCount = Math.floor(sorted.length * 0.1);
      const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
      return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    }
    return speedSamples.length > 0 ? speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length : 0;
  }, []);

  const measureUpload = useCallback(async (): Promise<number> => {
    const testDuration = 10000;
    const chunkSize = 2 * 1024 * 1024;
    const startTime = performance.now();
    const speedSamples: number[] = [];
    abortControllerRef.current = new AbortController();
    const blob = new Blob([new ArrayBuffer(chunkSize)]);
    try {
      while (performance.now() - startTime < testDuration) {
        const chunkStart = performance.now();
        try {
          await fetch('https://speed.cloudflare.com/__up', { method: 'POST', body: blob, cache: 'no-cache', mode: 'cors', signal: abortControllerRef.current.signal });
          const duration = (performance.now() - chunkStart) / 1000;
          const speedMbps = (chunkSize * 8) / (duration * 1000000);
          speedSamples.push(speedMbps);
          setCurrentSpeed(speedMbps);
          const elapsed = performance.now() - startTime;
          setProgress(66 + (elapsed / testDuration) * 34);
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') break;
        }
      }
    } catch { /* interrupted */ }
    if (speedSamples.length > 5) {
      const sorted = [...speedSamples].sort((a, b) => a - b);
      const trimCount = Math.floor(sorted.length * 0.1);
      const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
      return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    }
    return speedSamples.length > 0 ? speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length : 0;
  }, []);

  const runSpeedTest = async () => {
    setPhase('ping');
    setResults({ download: 0, upload: 0, ping: 0 });
    setCurrentSpeed(0);
    setProgress(0);
    particlesRef.current = [];
    try {
      setProgress(10);
      const ping = await measurePing();
      setResults(prev => ({ ...prev, ping: Math.round(ping) }));
      setProgress(33);
      setPhase('download');
      const download = await measureDownload();
      setResults(prev => ({ ...prev, download: Math.round(download * 10) / 10 }));
      setCurrentSpeed(0);
      setProgress(66);
      setPhase('upload');
      const upload = await measureUpload();
      setResults(prev => ({ ...prev, upload: Math.round(upload * 10) / 10 }));
      setProgress(100);
      setPhase('complete');
      onTestComplete?.(download);
      window.dispatchEvent(new CustomEvent('speed-test-complete', { detail: { downloadSpeed: download } }));
      toast({ title: "Prueba completada", description: `↓ ${download.toFixed(1)} Mbps | ↑ ${upload.toFixed(1)} Mbps | ${Math.round(ping)} ms` });
    } catch (error) {
      console.error('Speed test error:', error);
      setPhase('idle');
      toast({ title: "Error en la prueba", description: "No se pudo completar la prueba de velocidad", variant: "destructive" });
    }
  };

  const stopTest = () => {
    abortControllerRef.current?.abort();
    setPhase('idle');
    setProgress(0);
    setCurrentSpeed(0);
  };

  const isRunning = phase !== 'idle' && phase !== 'complete';

  const getPhaseLabel = () => {
    switch (phase) {
      case 'ping': return 'MIDIENDO LATENCIA';
      case 'download': return 'DOWNLOAD STREAM';
      case 'upload': return 'UPLOAD STREAM';
      case 'complete': return 'PRUEBA COMPLETADA';
      default: return 'LISTO PARA INICIAR';
    }
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case 'download': return <Download className="h-4 w-4" />;
      case 'upload': return <Upload className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const displaySpeed = phase === 'complete' ? results.download : currentSpeed;

  return (
    <div className="rounded-2xl overflow-hidden border border-border/30 bg-[hsl(220,20%,6%)]">
      {/* Canvas area with overlay data */}
      <div className="relative h-72 sm:h-80">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ background: 'radial-gradient(ellipse at center, hsl(220,30%,10%) 0%, hsl(220,20%,4%) 100%)' }}
        />
        
        {/* Top labels */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
              {getPhaseIcon()}
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/80">{getPhaseLabel()}</span>
            </div>
          </div>
          {results.ping > 0 && (
            <div className="text-right bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Latencia</p>
              <p className="text-lg font-bold text-white">{results.ping}<span className="text-xs text-white/60 ml-0.5">ms</span></p>
            </div>
          )}
        </div>
        
        {/* Central speed display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="text-center drop-shadow-2xl">
            <span className="text-7xl sm:text-8xl font-black tabular-nums tracking-tight leading-none" style={{
              color: 'white',
              textShadow: `0 0 20px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.8)`,
              WebkitTextStroke: '1px rgba(255,255,255,0.3)',
            }}>
              {displaySpeed.toFixed(1)}
            </span>
            <div className="mt-1">
              <span className="text-base font-bold text-white/80 tracking-[0.3em] uppercase drop-shadow-lg">Mbps</span>
            </div>
          </div>
        </div>

        {/* Bottom info during running */}
        {(phase === 'download' || phase === 'upload') && (
          <div className="absolute bottom-12 left-0 right-0 z-10 pointer-events-none">
            <div className="flex justify-center gap-8 text-center">
              {phase === 'upload' && results.download > 0 && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Download</p>
                  <p className="text-sm font-bold text-white/60">{results.download.toFixed(1)} <span className="text-[10px]">Mbps</span></p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {isRunning && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, hsl(220,70%,60%), hsl(${currentSpeed < 80 ? 180 : 140},70%,55%))`
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/25 mt-1 px-1">
              <span>Ping</span>
              <span>Descarga</span>
              <span>Subida</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls & Results */}
      <div className="p-5 space-y-4">
        {/* Start/Stop */}
        <div className="flex justify-center">
          <Button
            onClick={isRunning ? stopTest : runSpeedTest}
            size="lg"
            className={`px-10 rounded-full text-sm font-semibold transition-all ${
              isRunning 
                ? 'bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/25' 
                : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25'
            }`}
          >
            <Zap className="h-4 w-4 mr-2" />
            {isRunning ? 'Detener' : 'Iniciar Prueba'}
          </Button>
        </div>

        {/* Results cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-secondary/50 border border-border/30">
            <Download className="h-4 w-4 text-emerald-400 mx-auto mb-1.5" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Descarga</p>
            <p className="text-lg font-bold text-foreground">{results.download.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Mbps</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-secondary/50 border border-border/30">
            <Upload className="h-4 w-4 text-cyan-400 mx-auto mb-1.5" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Subida</p>
            <p className="text-lg font-bold text-foreground">{results.upload.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Mbps</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-secondary/50 border border-border/30">
            <Activity className="h-4 w-4 text-amber-400 mx-auto mb-1.5" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Ping</p>
            <p className="text-lg font-bold text-foreground">{results.ping}</p>
            <p className="text-[10px] text-muted-foreground">ms</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-white/20 px-1">
          <span>Servidor: Cloudflare Global CDN</span>
          <span>ISP: Silverdata</span>
        </div>
      </div>
    </div>
  );
};

export default SpeedTest;
