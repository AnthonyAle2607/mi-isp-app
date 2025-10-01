import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Globe, Shield } from "lucide-react";

const NetworkInfo = () => {
  const [ipInfo, setIpInfo] = useState<{
    ip: string;
    isIPv6: boolean;
    loading: boolean;
  }>({
    ip: "",
    isIPv6: false,
    loading: true
  });

  useEffect(() => {
    const fetchIPInfo = async () => {
      console.log('🔍 Intentando obtener información de IP...');
      
      // Try multiple APIs in sequence
      const apis = [
        { url: 'https://api.ipify.org?format=json', name: 'ipify' },
        { url: 'https://api64.ipify.org?format=json', name: 'ipify64' },
        { url: 'https://api.my-ip.io/v2/ip.json', name: 'my-ip.io' },
        { url: 'https://ipapi.co/json/', name: 'ipapi', field: 'ip' }
      ];

      for (const api of apis) {
        try {
          console.log(`📡 Probando API: ${api.name}`);
          const response = await fetch(api.url, {
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.log(`❌ ${api.name} falló con status: ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          const ip = api.field ? data[api.field] : data.ip;
          
          if (!ip) {
            console.log(`❌ ${api.name} no devolvió IP`);
            continue;
          }
          
          console.log(`✅ IP obtenida de ${api.name}: ${ip}`);
          
          // Check if it's IPv6 (contains colons)
          const isIPv6 = ip.includes(':');
          console.log(`🔍 Tipo de IP detectado: ${isIPv6 ? 'IPv6' : 'IPv4'}`);
          
          setIpInfo({
            ip,
            isIPv6,
            loading: false
          });
          return; // Success, exit
        } catch (error) {
          console.error(`❌ Error con ${api.name}:`, error);
        }
      }
      
      // All APIs failed
      console.error('❌ Todas las APIs de IP fallaron');
      setIpInfo({
        ip: "No disponible",
        isIPv6: false,
        loading: false
      });
    };

    fetchIPInfo();
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Información de Red</h3>
            <p className="text-sm text-muted-foreground">Detalles de tu conexión</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/30 rounded-lg p-4">
            <Globe className="h-6 w-6 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Tu IP</p>
            {ipInfo.loading ? (
              <p className="text-sm font-mono text-foreground">Cargando...</p>
            ) : (
              <p className="text-sm font-mono text-foreground truncate" title={ipInfo.ip}>
                {ipInfo.ip}
              </p>
            )}
          </div>
          
          <div className="bg-secondary/30 rounded-lg p-4">
            <Shield className="h-6 w-6 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Protocolo</p>
            {ipInfo.loading ? (
              <p className="text-lg font-bold text-foreground">...</p>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-foreground">
                  {ipInfo.isIPv6 ? "IPv6" : "IPv4"}
                </p>
                {ipInfo.isIPv6 && (
                  <span className="text-xs bg-success-green/20 text-success-green px-2 py-1 rounded">
                    Moderno
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {!ipInfo.loading && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              {ipInfo.isIPv6 
                ? "✓ Tu conexión utiliza IPv6, el protocolo más moderno de internet con mayor capacidad de direcciones."
                : "Tu conexión utiliza IPv4. IPv6 ofrece mejor rendimiento y mayor número de direcciones disponibles."}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NetworkInfo;
