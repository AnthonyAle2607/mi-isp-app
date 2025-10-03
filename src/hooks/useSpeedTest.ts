import { useState, useCallback, useRef } from 'react';
import { SpeedTestService, SpeedTestResults } from '../services/speedTestAPI';

export const useSpeedTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [progress, setProgress] = useState({
    phase: 'idle' as 'idle' | 'ping' | 'download' | 'upload' | 'complete',
    percent: 0,
    currentSpeed: 0
  });
  const [results, setResults] = useState<SpeedTestResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const testService = useRef(new SpeedTestService());
  const abortController = useRef<AbortController>();

  const runTest = useCallback(async () => {
    setIsTesting(true);
    setError(null);
    setProgress({ phase: 'ping', percent: 0, currentSpeed: 0 });
    abortController.current = new AbortController();

    try {
      // Fase 1: Ping
      setProgress({ phase: 'ping', percent: 25, currentSpeed: 0 });
      const ping = await testService.current.measurePing();

      // Fase 2: Download
      setProgress({ phase: 'download', percent: 50, currentSpeed: 0 });
      const downloadSpeed = await testService.current.downloadTest();

      // Fase 3: Upload
      setProgress({ phase: 'upload', percent: 75, currentSpeed: 0 });
      const uploadSpeed = await testService.current.uploadTest();

      // Calcular jitter (variación del ping)
      const jitter = await measureJitter(testService.current);

      // Resultados finales
      const testResults: SpeedTestResults = {
        download: downloadSpeed,
        upload: uploadSpeed,
        ping: ping,
        jitter: jitter,
        timestamp: new Date().toISOString()
      };

      setResults(testResults);
      setProgress({ phase: 'complete', percent: 100, currentSpeed: 0 });

      // Guardar resultados
      await testService.current.saveResults(testResults);

      return testResults;

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Error en la prueba de velocidad');
        throw err;
      }
    } finally {
      if (abortController.current?.signal.aborted === false) {
        setIsTesting(false);
      }
    }
  }, []);

  const cancelTest = useCallback(() => {
    abortController.current?.abort();
    setIsTesting(false);
    setProgress({ phase: 'idle', percent: 0, currentSpeed: 0 });
  }, []);

  const resetTest = useCallback(() => {
    setResults(null);
    setError(null);
    setProgress({ phase: 'idle', percent: 0, currentSpeed: 0 });
  }, []);

  return {
    isTesting,
    progress,
    results,
    error,
    runTest,
    cancelTest,
    resetTest
  };
};

// Función auxiliar para medir jitter
async function measureJitter(service: SpeedTestService): Promise<number> {
  const pings: number[] = [];
  
  for (let i = 0; i < 5; i++) {
    const ping = await service.measurePing();
    pings.push(ping);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  let jitter = 0;
  for (let i = 1; i < pings.length; i++) {
    jitter += Math.abs(pings[i] - pings[i - 1]);
  }
  return jitter / (pings.length - 1);
}