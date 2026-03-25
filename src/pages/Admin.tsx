import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, BarChart3, Shield, ArrowLeft, Ticket, Activity, Ban, LogOut, Link2, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EditUserDialog from '@/components/Dashboard/EditUserDialog';
import EditTechnicalDataDialog from '@/components/Dashboard/EditTechnicalDataDialog';
import CreateUserDialog from '@/components/Dashboard/CreateUserDialog';
import AdminTicketsPanel from '@/components/Dashboard/AdminTicketsPanel';
import LiveTrafficMonitor from '@/components/Admin/LiveTrafficMonitor';
import MassSuspension from '@/components/Admin/MassSuspension';
import WithdrawalRequestsPanel from '@/components/Admin/WithdrawalRequestsPanel';
import OdooIntegrationPanel from '@/components/Admin/OdooIntegrationPanel';
import AdminNotificationsPanel from '@/components/Admin/AdminNotificationsPanel';

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
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Cargando panel de administración...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const activeUsers = profiles.filter(p => p.account_status === 'active').length;
  const adminCount = userRoles.filter(r => r.role === 'admin').length;
  const suspendedCount = profiles.filter(p => p.account_status === 'suspended').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 fade-in-up">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 shine relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin-home')}
                className="h-10 w-10 rounded-xl bg-secondary/30 hover:bg-secondary/50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Panel de Administración</h1>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Gestiona usuarios y configuraciones del ISP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Usuarios', value: profiles.length, icon: Users, color: 'text-primary' },
            { label: 'Activos', value: activeUsers, icon: Activity, color: 'text-success-green' },
            { label: 'Suspendidos', value: suspendedCount, icon: Ban, color: 'text-destructive' },
            { label: 'Admins', value: adminCount, icon: Shield, color: 'text-primary' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card rounded-xl p-4 text-center space-y-1">
              <Icon className={`h-5 w-5 ${color} mx-auto`} />
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <div className="glass-card rounded-xl p-1.5">
            <TabsList className="grid w-full grid-cols-9 bg-transparent">
              {[
                { value: 'users', icon: Users, label: 'Usuarios' },
                { value: 'tickets', icon: Ticket, label: 'Tickets' },
                { value: 'notifications', icon: Bell, label: 'Avisos' },
                { value: 'withdrawals', icon: LogOut, label: 'Retiros' },
                { value: 'traffic', icon: Activity, label: 'Tráfico' },
                { value: 'suspension', icon: Ban, label: 'Cortes' },
                { value: 'odoo', icon: Link2, label: 'Odoo' },
                { value: 'stats', icon: BarChart3, label: 'Stats' },
                { value: 'settings', icon: Settings, label: 'Config' },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="users" className="space-y-4">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Gestión de Usuarios</h3>
                  <p className="text-sm text-muted-foreground">Administra todos los usuarios registrados</p>
                </div>
                <CreateUserDialog onUserCreated={fetchAllData} />
              </div>
              <div className="space-y-3">
                {profiles.map((profile) => {
                  const role = getUserRole(profile.user_id);
                  return (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border/30 hover:border-primary/20 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">
                            {profile.full_name || 'Sin nombre'}
                          </h3>
                          <Badge variant={role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                            {role === 'admin' ? 'Admin' : 'Usuario'}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={
                              profile.account_status === 'active'
                                ? 'bg-success-green/10 text-success-green border-success-green/20'
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                            }
                          >
                            {profile.account_status === 'active' ? 'Activo' : profile.account_status === 'suspended' ? 'Suspendido' : 'Inactivo'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                          <span>Plan: {profile.plan_type || 'Sin plan'}</span>
                          <span>IP: {profile.ip_address || 'N/A'}</span>
                          <span>Contrato: {profile.contract_number || 'N/A'}</span>
                          <span>Tel: {profile.phone || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <EditUserDialog profile={profile} userRole={role} onUpdate={fetchAllData} />
                        <EditTechnicalDataDialog profile={profile} onUpdate={fetchAllData} />
                        {role !== 'admin' && (
                          <Button
                            size="sm"
                            onClick={() => makeUserAdmin(profile.user_id)}
                            className="text-xs h-8 shine"
                          >
                            Hacer Admin
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets"><AdminTicketsPanel /></TabsContent>
          <TabsContent value="notifications"><AdminNotificationsPanel /></TabsContent>
          <TabsContent value="withdrawals"><WithdrawalRequestsPanel /></TabsContent>
          <TabsContent value="traffic"><LiveTrafficMonitor /></TabsContent>
          <TabsContent value="suspension"><MassSuspension /></TabsContent>
          <TabsContent value="odoo"><OdooIntegrationPanel /></TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Total Usuarios', value: profiles.length, desc: 'Usuarios registrados' },
                { title: 'Administradores', value: adminCount, desc: 'Usuarios con rol admin' },
                { title: 'Usuarios Activos', value: activeUsers, desc: 'Cuentas activas' },
              ].map(({ title, value, desc }) => (
                <div key={title} className="glass-card rounded-xl p-6 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className="text-4xl font-bold gradient-text">{value}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="glass-card rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Configuración del Sistema</h3>
                <p className="text-sm text-muted-foreground">Ajustes globales de la plataforma ISP</p>
              </div>

              <div className="p-5 rounded-xl bg-secondary/20 border border-border/30 space-y-3">
                <h4 className="font-semibold text-foreground">Gestión Automática de Servicios</h4>
                <p className="text-sm text-muted-foreground">
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

              <div className="p-5 rounded-xl bg-secondary/20 border border-border/30">
                <h4 className="font-semibold text-foreground mb-3">Funcionalidades Disponibles</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {[
                    'Gestión de usuarios y roles',
                    'Gestión de IPs estáticas',
                    'Sistema de tickets de soporte',
                    'Corte/reactivación automática',
                    'Fechas de corte programadas',
                    'Historial de tickets y reportes',
                    'Cambio de contraseña por usuario',
                    'Estadísticas en tiempo real',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="text-success-green">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
