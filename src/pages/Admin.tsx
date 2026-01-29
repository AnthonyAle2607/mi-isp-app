import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, BarChart3, Shield, ArrowLeft, Ticket, Activity, Ban, LogOut, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EditUserDialog from '@/components/Dashboard/EditUserDialog';
import EditTechnicalDataDialog from '@/components/Dashboard/EditTechnicalDataDialog';
import CreateUserDialog from '@/components/Dashboard/CreateUserDialog';
import AdminTicketsPanel from '@/components/Dashboard/AdminTicketsPanel';
import LiveTrafficMonitor from '@/components/Admin/LiveTrafficMonitor';
import MassSuspension from '@/components/Admin/MassSuspension';
import WithdrawalRequestsPanel from '@/components/Admin/WithdrawalRequestsPanel';
import OdooIntegrationPanel from '@/components/Admin/OdooIntegrationPanel';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  ip_address?: string;
  contract_number?: string;
  plan_type: string;
  account_status: string;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Get tab from URL params
  const defaultTab = searchParams.get('tab') || 'users';

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      setProfiles(profilesData || []);
      setUserRoles(rolesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const makeUserAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Usuario promovido a administrador",
      });

      fetchAllData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    }
  };

  const getUserRole = (userId: string) => {
    return userRoles.find(role => role.user_id === userId)?.role || 'user';
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-white text-xl">Cargando panel de administración...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin-home')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Inicio
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                Panel de Administración
              </h1>
              <p className="text-muted-foreground">Gestiona usuarios y configuraciones del ISP</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden sm:inline">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Retiros</span>
            </TabsTrigger>
            <TabsTrigger value="traffic" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Tráfico</span>
            </TabsTrigger>
            <TabsTrigger value="suspension" className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              <span className="hidden sm:inline">Cortes</span>
            </TabsTrigger>
            <TabsTrigger value="odoo" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Odoo</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Estadísticas</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestión de Usuarios</CardTitle>
                    <CardDescription>
                      Administra todos los usuarios registrados en la plataforma
                    </CardDescription>
                  </div>
                  <CreateUserDialog onUserCreated={fetchAllData} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profiles.map((profile) => {
                    const role = getUserRole(profile.user_id);
                    return (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-card/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">
                              {profile.full_name || 'Sin nombre'}
                            </h3>
                            <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
                              {role === 'admin' ? 'Administrador' : 'Usuario'}
                            </Badge>
                            <Badge variant={profile.account_status === 'active' ? 'default' : 'destructive'}>
                              {profile.account_status === 'active' ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 space-y-1">
                            <p><span className="font-medium">Plan:</span> {profile.plan_type || 'Sin plan'}</p>
                            <p><span className="font-medium">IP:</span> {profile.ip_address || 'No asignada'}</p>
                            <p><span className="font-medium">Contrato:</span> {profile.contract_number || 'Sin contrato'}</p>
                            <p><span className="font-medium">Teléfono:</span> {profile.phone || 'No registrado'}</p>
                            <p><span className="font-medium">Dirección:</span> {profile.address || 'No registrada'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <EditUserDialog 
                            profile={profile} 
                            userRole={role}
                            onUpdate={fetchAllData}
                          />
                          <EditTechnicalDataDialog
                            profile={profile}
                            onUpdate={fetchAllData}
                          />
                          {role !== 'admin' && (
                            <Button
                              size="sm"
                              onClick={() => makeUserAdmin(profile.user_id)}
                              className="bg-primary hover:bg-primary/90"
                            >
                              Hacer Admin
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            <AdminTicketsPanel />
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-6">
            <WithdrawalRequestsPanel />
          </TabsContent>

          <TabsContent value="traffic" className="space-y-6">
            <LiveTrafficMonitor />
          </TabsContent>

          <TabsContent value="suspension" className="space-y-6">
            <MassSuspension />
          </TabsContent>

          <TabsContent value="odoo" className="space-y-6">
            <OdooIntegrationPanel />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {profiles.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usuarios registrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Administradores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {userRoles.filter(r => r.role === 'admin').length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usuarios con rol admin
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usuarios Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {profiles.filter(p => p.account_status === 'active').length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cuentas activas
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
                <CardDescription>
                  Ajustes globales de la plataforma ISP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-card/50">
                    <h3 className="font-semibold text-foreground mb-2">
                      Gestión Automática de Servicios
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      El sistema realiza cortes automáticos cada día 5 del mes para cuentas sin pago.
                      Los servicios se reactivan automáticamente al verificarse el pago.
                    </p>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke('auto-suspend-accounts');
                          if (error) throw error;
                          toast({
                            title: "Ejecutado",
                            description: `Verificación completada: ${JSON.stringify(data)}`,
                          });
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message,
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Ejecutar Verificación de Cortes
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg bg-card/50">
                    <h3 className="font-semibold text-foreground mb-2">
                      Funcionalidades Disponibles
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✅ Gestión de usuarios y roles</li>
                      <li>✅ Gestión de IPs estáticas</li>
                      <li>✅ Sistema de tickets de soporte</li>
                      <li>✅ Corte/reactivación automática basada en pagos</li>
                      <li>✅ Fechas de corte programadas (día 5 de cada mes)</li>
                      <li>✅ Historial de tickets y reportes</li>
                      <li>✅ Cambio de contraseña por usuario</li>
                      <li>✅ Estadísticas básicas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;