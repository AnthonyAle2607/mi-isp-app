import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Upload,
  Download
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

const OdooIntegrationPanel = () => {
  const [config, setConfig] = useState<OdooConfig>({
    db: '',
    username: '',
    uid: null,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [stats, setStats] = useState<OdooStats | null>(null);
  const [customers, setCustomers] = useState<Array<Record<string, unknown>>>([]);
  const [products, setProducts] = useState<Array<Record<string, unknown>>>([]);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const { toast } = useToast();

  // Cargar configuración guardada
  useEffect(() => {
    const savedConfig = localStorage.getItem('odoo_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        if (parsed.uid) {
          setIsConnected(true);
        }
      } catch (e) {
        console.error('Error loading Odoo config:', e);
      }
    }
  }, []);

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
    setProducts([]);
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
      const data = await callOdoo('list_customers', { limit: 50 });
      setCustomers(data as Array<Record<string, unknown>>);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al cargar clientes',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await callOdoo('get_products');
      setProducts(data as Array<Record<string, unknown>>);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al cargar productos',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncPlansToOdoo = async () => {
    setIsLoading(true);
    setSyncStatus('Sincronizando planes...');
    try {
      const data = await callOdoo('sync_plans');
      const results = data as Array<{ plan: string; created?: boolean; updated?: boolean }>;
      
      const created = results.filter(r => r.created).length;
      const updated = results.filter(r => r.updated).length;
      
      toast({
        title: "✅ Sincronización completada",
        description: `${created} planes creados, ${updated} actualizados en Odoo`,
      });
      
      await loadProducts();
    } catch (error) {
      toast({
        title: "Error de sincronización",
        description: error instanceof Error ? error.message : 'Error al sincronizar planes',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSyncStatus('');
    }
  };

  const syncCustomerToOdoo = async (profile: Record<string, unknown>) => {
    try {
      const data = await callOdoo('sync_customer', { profile });
      const result = data as { created?: boolean; updated?: boolean; partner_id: number };
      
      toast({
        title: result.created ? "Cliente creado" : "Cliente actualizado",
        description: `ID en Odoo: ${result.partner_id}`,
      });
      
      await loadCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al sincronizar cliente',
        variant: "destructive",
      });
    }
  };

  const syncAllCustomersToOdoo = async () => {
    setIsLoading(true);
    setSyncStatus('Sincronizando clientes...');
    try {
      // Obtener todos los perfiles de Silverdata
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .not('cedula', 'is', null);

      if (error) throw error;

      let synced = 0;
      for (const profile of profiles || []) {
        try {
          await callOdoo('sync_customer', { profile });
          synced++;
          setSyncStatus(`Sincronizando clientes... ${synced}/${profiles?.length || 0}`);
        } catch (e) {
          console.error(`Error syncing ${profile.cedula}:`, e);
        }
      }

      toast({
        title: "✅ Sincronización completada",
        description: `${synced} clientes sincronizados a Odoo`,
      });

      await loadCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al sincronizar clientes',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSyncStatus('');
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
                Sincroniza clientes, planes y facturas con tu sistema ERP
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
                  <Label htmlFor="db">Nombre de Base de Datos</Label>
                  <Input
                    id="db"
                    placeholder="ej: silverdata_prod"
                    value={config.db}
                    onChange={(e) => setConfig({ ...config, db: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    placeholder="ej: admin"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                La API Key ya está configurada en el servidor. Solo necesitas el nombre de la BD y usuario.
              </p>
              <div className="flex gap-2">
                <Button onClick={testConnection} variant="outline" disabled={isTesting}>
                  {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Probar Conexión
                </Button>
                <Button onClick={authenticate} disabled={isLoading}>
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

          {/* Tabs de sincronización */}
          <Tabs defaultValue="customers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customers">Clientes</TabsTrigger>
              <TabsTrigger value="products">Planes/Productos</TabsTrigger>
              <TabsTrigger value="invoices">Facturas</TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Sincronización de Clientes</CardTitle>
                    <div className="flex gap-2">
                      <Button onClick={loadCustomers} variant="outline" size="sm" disabled={isLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        Cargar de Odoo
                      </Button>
                      <Button onClick={syncAllCustomersToOdoo} size="sm" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        Sincronizar a Odoo
                      </Button>
                    </div>
                  </div>
                  {syncStatus && <p className="text-sm text-muted-foreground">{syncStatus}</p>}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Ref (Cédula)</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Deuda</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Haz clic en "Cargar de Odoo" para ver los clientes
                            </TableCell>
                          </TableRow>
                        ) : (
                          customers.map((customer) => (
                            <TableRow key={customer.id as number}>
                              <TableCell>{customer.id as number}</TableCell>
                              <TableCell>{customer.name as string}</TableCell>
                              <TableCell>{(customer.ref as string) || '-'}</TableCell>
                              <TableCell>{(customer.email as string) || '-'}</TableCell>
                              <TableCell>${((customer.credit as number) || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Sincronización de Planes</CardTitle>
                    <div className="flex gap-2">
                      <Button onClick={loadProducts} variant="outline" size="sm" disabled={isLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        Cargar de Odoo
                      </Button>
                      <Button onClick={syncPlansToOdoo} size="sm" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        Sincronizar Planes
                      </Button>
                    </div>
                  </div>
                  {syncStatus && <p className="text-sm text-muted-foreground">{syncStatus}</p>}
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Precio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              Haz clic en "Cargar de Odoo" para ver los productos
                            </TableCell>
                          </TableRow>
                        ) : (
                          products.map((product) => (
                            <TableRow key={product.id as number}>
                              <TableCell>{product.id as number}</TableCell>
                              <TableCell>{(product.default_code as string) || '-'}</TableCell>
                              <TableCell>{product.name as string}</TableCell>
                              <TableCell>${((product.list_price as number) || 0).toFixed(2)}</TableCell>
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
                  <CardTitle>Gestión de Facturas</CardTitle>
                  <CardDescription>
                    Busca facturas por cédula del cliente o crea nuevas facturas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Para ver o crear facturas, busca un cliente por su cédula en el panel de administración.
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
