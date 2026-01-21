import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Globe, Shield, AlertCircle } from "lucide-react";

const NetworkInfo = () => {
  const [ipInfo, setIpInfo] = useState<{
    ipv4: string;
    ipv6: string;
    hasIPv6: boolean;
    loading: boolean;
  }>({
    ipv4: "",
    ipv6: "",
    hasIPv6: false,
    loading: true
  });

  useEffect(() => {
    const fetchIPInfo = async () => {
      console.log('🔍 Obteniendo información de IP...');
      
      let ipv4 = "";
      let ipv6 = "";

      // Try to get IPv4
      const ipv4Apis = [
        { url: 'https://api.ipify.org?format=json', name: 'ipify' },
        { url: 'https://ipv4.icanhazip.com', name: 'icanhazip-v4', isText: true },
      ];

      for (const api of ipv4Apis) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(api.url, {
            method: 'GET',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) continue;
          
          if (api.isText) {
            const text = (await response.text()).trim();
            if (text && !text.includes(':')) {
              ipv4 = text;
              break;
            }
          } else {
            const data = await response.json();
            if (data.ip && !data.ip.includes(':')) {
              ipv4 = data.ip;
              break;
            }
          }
        } catch (error) {
          console.log(`IPv4 API ${api.name} failed`);
        }
      }

      // Try to get IPv6
      const ipv6Apis = [
        { url: 'https://api64.ipify.org?format=json', name: 'ipify64' },
        { url: 'https://ipv6.icanhazip.com', name: 'icanhazip-v6', isText: true },
      ];

      for (const api of ipv6Apis) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(api.url, {
            method: 'GET',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) continue;
          
          if (api.isText) {
            const text = (await response.text()).trim();
            if (text && text.includes(':')) {
              ipv6 = text;
              break;
            }
          } else {
            const data = await response.json();
            if (data.ip && data.ip.includes(':')) {
              ipv6 = data.ip;
              break;
            }
          }
        } catch (error) {
          console.log(`IPv6 API ${api.name} failed`);
        }
      }

      // If IPv6 API returned IPv4, it means no IPv6
      if (!ipv6 || !ipv6.includes(':')) {
        ipv6 = "";
      }

      // If we couldn't get IPv4 but have a non-v6 IP
      if (!ipv4 && ipv6 && !ipv6.includes(':')) {
        ipv4 = ipv6;
        ipv6 = "";
      }

      console.log(`✅ IPv4: ${ipv4 || 'No disponible'}, IPv6: ${ipv6 || 'No activo'}`);
      
      setIpInfo({
        ipv4: ipv4 || "No disponible",
        ipv6: ipv6,
        hasIPv6: !!ipv6,
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
          {/* IPv4 */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-0.5 rounded">IPv4</span>
            </div>
            <p className="text-xs text-muted-foreground">Tu IP pública</p>
            {ipInfo.loading ? (
              <p className="text-sm font-mono text-foreground">Cargando...</p>
            ) : (
              <p className="text-sm font-mono text-foreground truncate" title={ipInfo.ipv4}>
                {ipInfo.ipv4}
              </p>
            )}
          </div>
          
          {/* IPv6 */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                ipInfo.hasIPv6 
                  ? 'bg-success-green/20 text-success-green' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                IPv6
              </span>
            </div>
            {ipInfo.loading ? (
              <>
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="text-sm font-mono text-foreground">...</p>
              </>
            ) : ipInfo.hasIPv6 ? (
              <>
                <p className="text-xs text-muted-foreground">Tu IPv6</p>
                <p className="text-xs font-mono text-foreground truncate" title={ipInfo.ipv6}>
                  {ipInfo.ipv6}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Estado</p>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-warning-orange" />
                  <span className="text-sm text-warning-orange font-medium">No activo</span>
                </div>
              </>
            )}
          </div>
        </div>

        {!ipInfo.loading && (
          <div className={`rounded-lg p-3 border ${
            ipInfo.hasIPv6 
              ? 'bg-success-green/5 border-success-green/20' 
              : 'bg-warning-orange/5 border-warning-orange/20'
          }`}>
            <p className="text-xs text-muted-foreground">
              {ipInfo.hasIPv6 ? (
                <>
                  ✓ Tu conexión tiene <strong className="text-success-green">IPv6 activo</strong>. 
                  Esto proporciona mejor rendimiento y mayor compatibilidad con servicios modernos.
                </>
              ) : (
                <>
                  <span className="text-warning-orange">⚠ Tu conexión no tiene IPv6 activo.</span>{' '}
                  IPv6 ofrece mejor rendimiento y mayor número de direcciones. Contacta a soporte si deseas activarlo.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NetworkInfo;
