import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Link2, 
  RefreshCw, 
  Users, 
  FileText, 
  Package, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Download,
  Search,
  UserPlus
} from 'lucide-react';

interface OdooConfig {
  db: string;
  username: string;
  uid: number | null;
}

interface OdooStats {
  total_customers: number;
  pending_invoices: number;
  total_products: number;
}

interface OdooCustomer {
  id: number;
  name: string;
  ref?: string;
  email?: string;
  phone?: string;
  credit?: number;
  street?: string;
  city?: string;
  selected?: boolean;
}

const OdooIntegrationPanel = () => {
  const [config, setConfig] = useState<OdooConfig>({
    db: '',
    username: 'analistasoportatcsd@gmail.com',
    uid: null,
  });
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [stats, setStats] = useState<OdooStats | null>(null);
  const [customers, setCustomers] = useState<OdooCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
  const [importStatus, setImportStatus] = useState<string>('');
  const { toast } = useToast();

  // Cargar configuración guardada y buscar DBs disponibles
  useEffect(() => {
    const savedConfig = localStorage.getItem('odoo_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Keep the pre-filled username if no saved username
        setConfig(prev => ({
          ...parsed,
          username: parsed.username || prev.username
        }));
        if (parsed.uid) {
          setIsConnected(true);
        }
      } catch (e) {
        console.error('Error loading Odoo config:', e);
      }
    }
    // Auto-fetch available databases
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    setIsLoadingDatabases(true);
    try {
      const result = await supabase.functions.invoke('odoo-integration', {
        body: { action: 'list_databases' },
      });

      if (result.data?.success && result.data?.data?.databases) {
        const dbs = result.data.data.databases as string[];
        setAvailableDatabases(dbs);
        // Auto-select if only one database
        if (dbs.length === 1 && !config.db) {
          setConfig(prev => ({ ...prev, db: dbs[0] }));
        }
        if (dbs.length > 0) {
          toast({
            title: "✅ Bases de datos detectadas",
            description: `Se encontraron ${dbs.length} base(s) de datos: ${dbs.join(', ')}`,
          });
        }
      } else if (result.data?.data?.error) {
        console.log("DB listing disabled:", result.data.data.error);
      }
    } catch (error) {
      console.error('Error fetching databases:', error);
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const saveConfig = (newConfig: OdooConfig) => {
    setConfig(newConfig);
    localStorage.setItem('odoo_config', JSON.stringify(newConfig));
  };

  const callOdoo = async (action: string, data: Record<string, unknown> = {}) => {
    const response = await supabase.functions.invoke('odoo-integration', {
      body: {
        action,
        data: {
          ...data,
          db: config.db,
          uid: config.uid,
        },
      },
    });

    if (response.error) throw new Error(response.error.message);
    if (!response.data.success) throw new Error(response.data.error);
    
    return response.data.data;
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const result = await supabase.functions.invoke('odoo-integration', {
        body: { action: 'test_connection' },
      });

      if (result.data?.success) {
        toast({
          title: "✅ Conexión exitosa",
          description: `Versión de Odoo: ${JSON.stringify(result.data.data.version)}`,
        });
        return true;
      } else {
        throw new Error(result.data?.error || 'Error de conexión');
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : 'No se pudo conectar a Odoo',
        variant: "destructive",
      });
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  const authenticate = async () => {
    if (!config.db || !config.username) {
      toast({
        title: "Datos incompletos",
        description: "Ingresa el nombre de la base de datos y usuario",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await supabase.functions.invoke('odoo-integration', {
        body: {
          action: 'authenticate',
          data: {
            db: config.db,
            username: config.username,
          },
        },
      });

      if (result.data?.success && result.data.data.uid) {
        const newConfig = { ...config, uid: result.data.data.uid };
        saveConfig(newConfig);
        setIsConnected(true);
        toast({
          title: "✅ Autenticación exitosa",
          description: `UID: ${result.data.data.uid}`,
        });
        // Cargar estadísticas
        await loadStats();
      } else {
        throw new Error(result.data?.error || 'Credenciales inválidas');
      }
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : 'No se pudo autenticar',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    saveConfig({ db: '', username: '', uid: null });
    setIsConnected(false);
    setStats(null);
    setCustomers([]);
    setSelectedCustomers(new Set());
    toast({
      title: "Desconectado",
      description: "Se ha cerrado la conexión con Odoo",
    });
  };

  const loadStats = async () => {
    try {
      const data = await callOdoo('get_stats');
      setStats(data as OdooStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await callOdoo('list_customers', { limit: 100 });
      setCustomers((data as OdooCustomer[]).map(c => ({ ...c, selected: false })));
      setSelectedCustomers(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al cargar clientes de Odoo',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCustomerSelection = (customerId: number) => {
    setSelectedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    }
  };

  const importSelectedCustomers = async () => {
    if (selectedCustomers.size === 0) {
      toast({
        title: "Sin selección",
        description: "Selecciona al menos un cliente para importar",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportStatus('Importando clientes...');
    
    try {
      const customersToImport = customers.filter(c => selectedCustomers.has(c.id));
      let imported = 0;
      let skipped = 0;

      for (const customer of customersToImport) {
        setImportStatus(`Importando ${imported + 1}/${customersToImport.length}...`);
        
        try {
          const result = await callOdoo('import_customer_to_silverdata', { customer });
          const importResult = result as { imported?: boolean; skipped?: boolean; reason?: string };
          
          if (importResult.imported) {
            imported++;
          } else {
            skipped++;
          }
        } catch (e) {
          console.error(`Error importing ${customer.name}:`, e);
          skipped++;
        }
      }

      toast({
        title: "✅ Importación completada",
        description: `${imported} clientes importados, ${skipped} omitidos`,
      });
      
      setSelectedCustomers(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al importar clientes',
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportStatus('');
    }
  };

  const importAllCustomers = async () => {
    setIsImporting(true);
    setImportStatus('Importando todos los clientes...');
    
    try {
      let imported = 0;
      let skipped = 0;

      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        setImportStatus(`Importando ${i + 1}/${customers.length}...`);
        
        try {
          const result = await callOdoo('import_customer_to_silverdata', { customer });
          const importResult = result as { imported?: boolean; skipped?: boolean };
          
          if (importResult.imported) {
            imported++;
          } else {
            skipped++;
          }
        } catch (e) {
          console.error(`Error importing ${customer.name}:`, e);
          skipped++;
        }
      }

      toast({
        title: "✅ Importación completada",
        description: `${imported} clientes importados a Silverdata, ${skipped} omitidos (ya existían)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al importar clientes',
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportStatus('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado de conexión */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Integración con Odoo
              </CardTitle>
              <CardDescription>
                Importa clientes desde Odoo hacia Silverdata (solo lectura)
              </CardDescription>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"} className="text-sm">
              {isConnected ? (
                <><CheckCircle2 className="h-4 w-4 mr-1" /> Conectado</>
              ) : (
                <><XCircle className="h-4 w-4 mr-1" /> Desconectado</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db">Base de Datos</Label>
                  {availableDatabases.length > 0 ? (
                    <Select
                      value={config.db}
                      onValueChange={(value) => setConfig({ ...config, db: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una base de datos" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDatabases.map((db) => (
                          <SelectItem key={db} value={db}>{db}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        id="db"
                        placeholder="ej: silverdata_prod"
                        value={config.db}
                        onChange={(e) => setConfig({ ...config, db: e.target.value })}
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={fetchDatabases} 
                        disabled={isLoadingDatabases}
                        title="Buscar bases de datos"
                      >
                        {isLoadingDatabases ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                  {isLoadingDatabases && <p className="text-xs text-muted-foreground">Buscando bases de datos...</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario (Email)</Label>
                  <Input
                    id="username"
                    placeholder="tu-email@ejemplo.com"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Tu API Key ya está configurada. Se usará como contraseña para autenticar con Odoo.
              </p>
              <div className="flex gap-2">
                <Button onClick={testConnection} variant="outline" disabled={isTesting}>
                  {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Probar Conexión
                </Button>
                <Button onClick={authenticate} disabled={isLoading || !config.db || !config.username}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Conectar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span><strong>BD:</strong> {config.db}</span>
                <span><strong>Usuario:</strong> {config.username}</span>
                <span><strong>UID:</strong> {config.uid}</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadStats} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button onClick={disconnect} variant="destructive" size="sm">
                  Desconectar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas y funcionalidades */}
      {isConnected && (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_customers}</p>
                      <p className="text-sm text-muted-foreground">Clientes en Odoo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.pending_invoices}</p>
                      <p className="text-sm text-muted-foreground">Facturas pendientes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Package className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_products}</p>
                      <p className="text-sm text-muted-foreground">Productos/Planes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs de importación */}
          <Tabs defaultValue="customers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customers">Importar Clientes</TabsTrigger>
              <TabsTrigger value="invoices">Ver Facturas</TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Importar Clientes desde Odoo
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button onClick={loadCustomers} variant="outline" size="sm" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Cargar de Odoo
                      </Button>
                      {customers.length > 0 && (
                        <>
                          <Button 
                            onClick={importSelectedCustomers} 
                            size="sm" 
                            disabled={isImporting || selectedCustomers.size === 0}
                            variant="outline"
                          >
                            {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                            Importar Seleccionados ({selectedCustomers.size})
                          </Button>
                          <Button 
                            onClick={importAllCustomers} 
                            size="sm" 
                            disabled={isImporting}
                          >
                            {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Users className="h-4 w-4 mr-2" />}
                            Importar Todos
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {importStatus && <p className="text-sm text-muted-foreground">{importStatus}</p>}
                  <CardDescription>
                    Los clientes importados se crearán como nuevos usuarios en Silverdata. Si ya existen (por cédula), serán omitidos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={customers.length > 0 && selectedCustomers.size === customers.length}
                              onCheckedChange={toggleSelectAll}
                              disabled={customers.length === 0}
                            />
                          </TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Cédula (Ref)</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Deuda</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              Haz clic en "Cargar de Odoo" para ver los clientes disponibles
                            </TableCell>
                          </TableRow>
                        ) : (
                          customers.map((customer) => (
                            <TableRow 
                              key={customer.id} 
                              className={selectedCustomers.has(customer.id) ? 'bg-muted/50' : ''}
                            >
                              <TableCell>
                                <Checkbox 
                                  checked={selectedCustomers.has(customer.id)}
                                  onCheckedChange={() => toggleCustomerSelection(customer.id)}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-xs">{customer.id}</TableCell>
                              <TableCell className="font-medium">{customer.name}</TableCell>
                              <TableCell>{customer.ref || '-'}</TableCell>
                              <TableCell>{customer.email || '-'}</TableCell>
                              <TableCell>{customer.phone || '-'}</TableCell>
                              <TableCell>${(customer.credit || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Facturas en Odoo
                  </CardTitle>
                  <CardDescription>
                    Consulta las facturas de clientes directamente desde Odoo (solo lectura)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Busca un cliente por su cédula para ver sus facturas pendientes en Odoo.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default OdooIntegrationPanel;
