import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Activity, Search, Play, Pause, Download, Upload, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  ip_address: string;
  plan_type: string;
  account_status: string;
}

interface TrafficData {
  time: string;
  download: number;
  upload: number;
}

const LiveTrafficMonitor = () => {
  const [clients, setClients] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (isMonitoring && selectedClient) {
      // Simular datos de tráfico en tiempo real (en producción esto vendría de tu sistema de monitoreo)
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        // Generar datos simulados basados en el plan
        const planMultiplier = selectedClient.plan_type === 'premium' ? 100 : 
                              selectedClient.plan_type === 'business' ? 200 : 50;
        
        const newData: TrafficData = {
          time: timeStr,
          download: Math.random() * planMultiplier + 10,
          upload: Math.random() * (planMultiplier / 4) + 2,
        };

        setTrafficData(prev => {
          const updated = [...prev, newData];
          // Mantener solo los últimos 30 puntos de datos
          return updated.slice(-30);
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, selectedClient]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('ip_address', 'is', null)
      .order('full_name');

    if (!error && data) {
      setClients(data);
    }
  };

  const filteredClients = clients.filter(client => 
    client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.ip_address?.includes(searchQuery)
  );

  const selectClient = (client: Profile) => {
    setSelectedClient(client);
    setTrafficData([]);
    setIsMonitoring(false);
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const currentDownload = trafficData.length > 0 ? trafficData[trafficData.length - 1].download : 0;
  const currentUpload = trafficData.length > 0 ? trafficData[trafficData.length - 1].upload : 0;
  const avgDownload = trafficData.length > 0 
    ? trafficData.reduce((sum, d) => sum + d.download, 0) / trafficData.length 
    : 0;
  const avgUpload = trafficData.length > 0 
    ? trafficData.reduce((sum, d) => sum + d.upload, 0) / trafficData.length 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Monitor de Tráfico en Vivo
          <span className="text-xs font-normal text-muted-foreground ml-2">(Estilo Winbox)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Panel de búsqueda de clientes */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="h-[300px] overflow-y-auto border border-border rounded-lg">
              {filteredClients.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No hay clientes con IP asignada
                </div>
              ) : (
                filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => selectClient(client)}
                    className={`p-3 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors ${
                      selectedClient?.id === client.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {client.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-cyan-400 font-mono">
                          {client.ip_address}
                        </p>
                      </div>
                      {client.account_status === 'active' ? (
                        <Wifi className="h-4 w-4 text-success-green" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel de gráfica de tráfico */}
          <div className="lg:col-span-2 space-y-3">
            {selectedClient ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {selectedClient.full_name}
                    </h3>
                    <p className="text-sm text-cyan-400 font-mono">
                      IP: {selectedClient.ip_address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedClient.account_status === 'active' ? 'default' : 'destructive'}>
                      {selectedClient.account_status === 'active' ? 'Activo' : 'Suspendido'}
                    </Badge>
                    <Badge variant="outline">{selectedClient.plan_type}</Badge>
                    <Button
                      size="sm"
                      onClick={toggleMonitoring}
                      className={isMonitoring ? 'bg-destructive hover:bg-destructive/90' : 'bg-success-green hover:bg-success-green/90'}
                    >
                      {isMonitoring ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Detener
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Iniciar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Stats actuales */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <Download className="h-4 w-4 text-success-green mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Download</p>
                    <p className="text-lg font-bold text-success-green">
                      {currentDownload.toFixed(1)} Mbps
                    </p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <Upload className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Upload</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {currentUpload.toFixed(1)} Mbps
                    </p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <Activity className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Avg ↓</p>
                    <p className="text-lg font-bold text-amber-400">
                      {avgDownload.toFixed(1)} Mbps
                    </p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3 text-center">
                    <Activity className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Avg ↑</p>
                    <p className="text-lg font-bold text-purple-400">
                      {avgUpload.toFixed(1)} Mbps
                    </p>
                  </div>
                </div>

                {/* Gráfica de tráfico */}
                <div className="h-[200px] bg-[#1a1a2e] rounded-lg p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#666"
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        stroke="#666"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => `${value} Mbps`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a2e', 
                          border: '1px solid #333',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)} Mbps`]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="download" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={false}
                        name="Download"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="upload" 
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        dot={false}
                        name="Upload"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {!isMonitoring && trafficData.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    Presiona "Iniciar" para comenzar a monitorear el tráfico
                  </div>
                )}
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Selecciona un cliente para ver su tráfico en tiempo real</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTrafficMonitor;
