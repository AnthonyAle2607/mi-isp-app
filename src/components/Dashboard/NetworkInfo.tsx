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
      try {
        // Try to get IPv6 first
        const ipv6Response = await fetch('https://api64.ipify.org?format=json');
        const ipv6Data = await ipv6Response.json();
        const ip = ipv6Data.ip;
        
        // Check if it's IPv6 (contains colons)
        const isIPv6 = ip.includes(':');
        
        setIpInfo({
          ip,
          isIPv6,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch IP info:', error);
        setIpInfo({
          ip: "No disponible",
          isIPv6: false,
          loading: false
        });
      }
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
