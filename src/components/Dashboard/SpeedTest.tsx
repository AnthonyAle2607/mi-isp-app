import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Server, ChevronDown, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SpeedTestGauge from "./SpeedTestGauge";
import SpeedTestChart from "./SpeedTestChart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LIBRESPEED_SERVERS,
  LibreSpeedServer,
  getServerUrl,
  measurePingToServer,
  findBestServer,
} from "@/lib/librespeed";

type TestPhase = 'idle' | 'selecting' | 'ping' | 'download' | 'upload' | 'complete';

const SpeedTest = () => {
  const [phase, setPhase] = useState<TestPhase>('idle');
  const [selectedServer, setSelectedServer] = useState<LibreSpeedServer | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [downloadData, setDownloadData] = useState<number[]>([]);
  const [uploadData, setUploadData] = useState<number[]>([]);
  const [results, setResults] = useState({
    download: 0,
    upload: 0,
    ping: 0
  });
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const measurePing = useCallback(async (server: LibreSpeedServer): Promise<number> => {
    const url = getServerUrl(server, 'ping');
    const iterations = 5;
    let totalPing = 0;
    let successfulPings = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch(`${url}?r=${Math.random()}`, { 
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

  const measureDownload = useCallback(async (server: LibreSpeedServer): Promise<number> => {
    const url = getServerUrl(server, 'dl');
    const testDuration = 8000; // 8 seconds
    const chunkSize = 25 * 1024 * 1024; // 25MB chunks
    const startTime = performance.now();
    let totalBytes = 0;
    const speedSamples: number[] = [];
    let lastSampleTime = startTime;
    let lastBytes = 0;

    setDownloadData([]);
    abortControllerRef.current = new AbortController();

    try {
      while (performance.now() - startTime < testDuration) {
        const chunkStart = performance.now();
        
        try {
          const response = await fetch(`${url}?ckSize=${chunkSize}&r=${Math.random()}`, {
            method: 'GET',
            cache: 'no-cache',
            mode: 'cors',
            signal: abortControllerRef.current.signal
          });

          if (!response.ok) continue;

          const reader = response.body?.getReader();
          if (!reader) continue;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            totalBytes += value?.length || 0;

            // Update speed every 200ms
            const now = performance.now();
            if (now - lastSampleTime >= 200) {
              const duration = (now - lastSampleTime) / 1000;
              const bytesInPeriod = totalBytes - lastBytes;
              const speedMbps = (bytesInPeriod * 8) / (duration * 1000000);
              
              speedSamples.push(speedMbps);
              setCurrentSpeed(speedMbps);
              setDownloadData(prev => [...prev.slice(-49), speedMbps]);
              
              lastSampleTime = now;
              lastBytes = totalBytes;
            }
          }
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') break;
        }
      }
    } catch {
      // Test interrupted
    }

    // Calculate average, excluding lowest 10% and highest 10%
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

  const measureUpload = useCallback(async (server: LibreSpeedServer): Promise<number> => {
    const url = getServerUrl(server, 'ul');
    const testDuration = 8000; // 8 seconds
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks
    const startTime = performance.now();
    let totalBytes = 0;
    const speedSamples: number[] = [];

    setUploadData([]);
    abortControllerRef.current = new AbortController();

    const testData = new ArrayBuffer(chunkSize);
    const blob = new Blob([testData]);

    try {
      while (performance.now() - startTime < testDuration) {
        const chunkStart = performance.now();
        
        try {
          await fetch(`${url}?r=${Math.random()}`, {
            method: 'POST',
            body: blob,
            cache: 'no-cache',
            mode: 'cors',
            signal: abortControllerRef.current.signal
          });

          const chunkEnd = performance.now();
          totalBytes += chunkSize;
          
          const duration = (chunkEnd - chunkStart) / 1000;
          const speedMbps = (chunkSize * 8) / (duration * 1000000);
          
          speedSamples.push(speedMbps);
          setCurrentSpeed(speedMbps);
          setUploadData(prev => [...prev.slice(-49), speedMbps]);
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') break;
        }
      }
    } catch {
      // Test interrupted
    }

    // Calculate average, excluding lowest 10% and highest 10%
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
    setPhase('selecting');
    setResults({ download: 0, upload: 0, ping: 0 });
    setDownloadData([]);
    setUploadData([]);
    setCurrentSpeed(0);

    try {
      // Select best server if not manually selected
      let server = selectedServer;
      if (!server) {
        server = await findBestServer(LIBRESPEED_SERVERS);
        setSelectedServer(server);
      }

      // Measure ping
      setPhase('ping');
      const ping = await measurePing(server);
      setResults(prev => ({ ...prev, ping: Math.round(ping) }));

      // Measure download
      setPhase('download');
      const download = await measureDownload(server);
      setResults(prev => ({ ...prev, download: Math.round(download * 10) / 10 }));
      setCurrentSpeed(0);

      // Measure upload
      setPhase('upload');
      const upload = await measureUpload(server);
      setResults(prev => ({ ...prev, upload: Math.round(upload * 10) / 10 }));

      setPhase('complete');
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
  };

  const isRunning = phase !== 'idle' && phase !== 'complete';
  const maxSpeed = 1000; // 1 Gbps scale

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-[#0a1929] to-[#0d2137] border-[#1a3a52] overflow-hidden">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Prueba de Velocidad</h3>
              <p className="text-sm text-slate-400">LibreSpeed - Test real de conexión</p>
            </div>
          </div>

          {/* Server selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700">
                <Server className="h-4 w-4 mr-2 text-cyan-400" />
                <span className="truncate max-w-[150px]">
                  {selectedServer ? selectedServer.name.split(' (')[0] : 'Auto-selección'}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-slate-800 border-slate-600">
              <DropdownMenuItem 
                onClick={() => setSelectedServer(null)}
                className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700"
              >
                <MapPin className="h-4 w-4 mr-2 text-cyan-400" />
                Auto-selección (mejor ping)
              </DropdownMenuItem>
              {LIBRESPEED_SERVERS.map((server) => (
                <DropdownMenuItem
                  key={server.id}
                  onClick={() => setSelectedServer(server)}
                  className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700"
                >
                  <Server className="h-4 w-4 mr-2 text-slate-400" />
                  <span className="truncate">{server.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gauge */}
          <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded-xl p-4">
            <SpeedTestGauge
              value={currentSpeed}
              maxValue={maxSpeed}
              isDownload={phase === 'download'}
              isActive={isRunning}
              label={
                phase === 'selecting' ? 'Seleccionando servidor...' :
                phase === 'ping' ? 'Midiendo ping...' :
                phase === 'download' ? 'Recibiendo datos...' :
                phase === 'upload' ? 'Enviando datos...' :
                phase === 'complete' ? 'Completado' :
                'Listo para iniciar'
              }
            />

            {/* Progress indicator */}
            {isRunning && (
              <div className="mt-2 text-center">
                <span className={`text-lg font-semibold ${phase === 'download' ? 'text-cyan-400' : 'text-green-400'}`}>
                  {Math.round((
                    (phase === 'ping' ? 10 : phase === 'download' ? 50 : 90)
                  ))}%
                </span>
              </div>
            )}

            {/* Start/Stop button */}
            <Button
              onClick={isRunning ? stopTest : runSpeedTest}
              className={`mt-4 px-8 py-2 ${
                isRunning 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
              }`}
              size="lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isRunning ? 'Detener' : 'Iniciar Prueba'}
            </Button>
          </div>

          {/* Charts and results */}
          <div className="flex flex-col gap-3">
            {/* Download chart */}
            <div className="bg-slate-900/50 rounded-xl p-3">
              <SpeedTestChart
                data={downloadData}
                isDownload={true}
                label="Descargar"
              />
            </div>

            {/* Upload chart */}
            <div className="bg-slate-900/50 rounded-xl p-3">
              <SpeedTestChart
                data={uploadData}
                isDownload={false}
                label="Cargar"
              />
            </div>

            {/* Selected server info */}
            {selectedServer && (
              <div className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-cyan-400" />
                  <span className="text-slate-300">{selectedServer.name}</span>
                </div>
                {selectedServer.sponsorName && (
                  <span className="text-slate-500">{selectedServer.sponsorName}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results footer */}
        {(phase === 'complete' || results.download > 0 || results.upload > 0 || results.ping > 0) && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
            <div className="text-center p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <p className="text-xs text-cyan-300 mb-1">Descarga</p>
              <p className="text-xl font-bold text-cyan-400">{results.download.toFixed(1)}</p>
              <p className="text-xs text-slate-400">Mbps</p>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-xs text-green-300 mb-1">Subida</p>
              <p className="text-xl font-bold text-green-400">{results.upload.toFixed(1)}</p>
              <p className="text-xs text-slate-400">Mbps</p>
            </div>
            <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-xs text-blue-300 mb-1">Ping</p>
              <p className="text-xl font-bold text-blue-400">{results.ping}</p>
              <p className="text-xs text-slate-400">ms</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SpeedTest;
