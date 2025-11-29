import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Router, MapPin, X } from "lucide-react";
import type { NetworkDevice } from "@/pages/NetworkManagement";

interface GlobalClientSearchProps {
  devices: NetworkDevice[];
  onClientSelect: (device: NetworkDevice, parentNode: NetworkDevice | null) => void;
}

const GlobalClientSearch = ({ devices, onClientSelect }: GlobalClientSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const allClients = useMemo(() => 
    devices.filter(d => d.device_type === 'cpe'),
    [devices]
  );

  const filteredClients = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return allClients
      .filter(d => 
        d.ip_address.includes(query) || 
        d.name.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [allClients, searchQuery]);

  const getParentNode = (client: NetworkDevice) => {
    return devices.find(d => 
      d.device_type === 'nodo' && d.location === client.location
    ) || null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-[hsl(var(--network-online-bg))] text-[hsl(var(--network-online))] border-[hsl(var(--network-online))]">Online</Badge>;
      case 'offline':
        return <Badge className="bg-[hsl(var(--network-offline-bg))] text-[hsl(var(--network-offline))] border-[hsl(var(--network-offline))]">Offline</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleSelect = (client: NetworkDevice) => {
    const parentNode = getParentNode(client);
    onClientSelect(client, parentNode);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente por IP (ej: 192.168.1.100)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 bg-background/50"
        />
        {searchQuery && (
          <button 
            onClick={() => { setSearchQuery(''); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && filteredClients.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto shadow-lg border-border">
          <div className="p-2 space-y-1">
            {filteredClients.map(client => (
              <button
                key={client.id}
                onClick={() => handleSelect(client)}
                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Router className={`h-4 w-4 ${
                    client.status === 'online' 
                      ? 'text-[hsl(var(--network-online))]' 
                      : 'text-[hsl(var(--network-offline))]'
                  }`} />
                  <div>
                    <p className="font-mono text-sm font-semibold text-primary">{client.ip_address}</p>
                    <p className="text-xs text-foreground">{client.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {client.location}
                  </span>
                  {getStatusBadge(client.status)}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {isOpen && searchQuery.length >= 2 && filteredClients.length === 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 p-4 text-center text-muted-foreground text-sm">
          No se encontraron clientes con "{searchQuery}"
        </Card>
      )}
    </div>
  );
};

export default GlobalClientSearch;
