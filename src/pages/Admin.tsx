import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, BarChart3, Shield, ArrowLeft, Ticket, Activity, Ban, LogOut, Link2, Bell, Wifi, CalendarClock, DollarSign, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminUsersPanel from '@/components/Admin/AdminUsersPanel';
import AdminTicketsPanel from '@/components/Dashboard/AdminTicketsPanel';
import LiveTrafficMonitor from '@/components/Admin/LiveTrafficMonitor';
import MassSuspension from '@/components/Admin/MassSuspension';
import WithdrawalRequestsPanel from '@/components/Admin/WithdrawalRequestsPanel';
import OdooIntegrationPanel from '@/components/Admin/OdooIntegrationPanel';
import AdminNotificationsPanel from '@/components/Admin/AdminNotificationsPanel';
import ServicePlansPanel from '@/components/Admin/ServicePlansPanel';
import StatsCard from '@/components/Dashboard/StatsCard';
import { format, addDays, isWithinInterval } from 'date-fns';

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
  cedula?: string;
  cedula_type?: string;
  connection_type?: string;
  node?: string;
  olt_equipment?: string;
  sector?: string;
  pending_balance?: number;
  next_billing_date?: string;
  last_payment_date?: string;
  installation_date?: string;
  plan_id?: string;
  estado?: string;
  municipio?: string;
  parroquia?: string;
  calle?: string;
  casa?: string;
  nap_box?: string;
  nap_port?: string;
  onu_serial?: string;
  link_type?: string;
  technical_equipment?: string;
  ctif_notes?: string;
  birth_date?: string;
  gender?: string;
  permanence_months?: number;
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
    if (!loading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchAllData();
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      setProfiles(profilesRes.data || []);
      setUserRoles(rolesRes.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' });
    } finally { setLoadingData(false); }
  };

  const makeUserAdmin = async (userId: string) => {
    try {
      const { error } = await supabase.from('user_roles').update({ role: 'admin' }).eq('user_id', userId);
      if (error) throw error;
      toast({ title: 'Usuario promovido a administrador' });
      fetchAllData();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el rol', variant: 'destructive' });
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const active = profiles.filter(p => p.account_status === 'active').length;
    const suspended = profiles.filter(p => p.account_status === 'suspended').length;
    const admins = userRoles.filter(r => r.role === 'admin').length;
    const totalDebt = profiles.reduce((sum, p) => sum + (p.pending_balance || 0), 0);

    const today = new Date();
    const cutoffEnd = addDays(today, 7);
    const upcomingCuts = profiles.filter(p => {
      if (!p.next_billing_date || p.account_status !== 'active') return false;
      const d = new Date(p.next_billing_date);
      return isWithinInterval(d, { start: today, end: cutoffEnd });
    }).length;

    const fiber = profiles.filter(p => p.connection_type === 'fibra').length;
    const radio = profiles.filter(p => p.connection_type === 'radio').length;

    return { active, suspended, admins, totalDebt, upcomingCuts, fiber, radio, total: profiles.length };
  }, [profiles, userRoles]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Cargando panel...
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 fade-in-up">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 shine relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin-home')} className="h-10 w-10 rounded-xl bg-secondary/30 hover:bg-secondary/50">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Panel de Administración</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Gestiona usuarios, planes y configuraciones del ISP</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatsCard title="Total" value={String(stats.total)} icon={<Users className="h-5 w-5" />} />
          <StatsCard title="Activos" value={String(stats.active)} icon={<Activity className="h-5 w-5" />} subtitle={`${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}%`} trend="up" />
          <StatsCard title="Suspendidos" value={String(stats.suspended)} icon={<Ban className="h-5 w-5" />} trend={stats.suspended > 0 ? 'down' : 'neutral'} />
          <StatsCard title="Cortes próximos" value={String(stats.upcomingCuts)} icon={<CalendarClock className="h-5 w-5" />} subtitle="Próx. 7 días" trend={stats.upcomingCuts > 0 ? 'down' : 'neutral'} />
          <StatsCard title="Deuda total" value={`$${stats.totalDebt.toFixed(0)}`} icon={<DollarSign className="h-5 w-5" />} trend={stats.totalDebt > 0 ? 'down' : 'neutral'} />
          <StatsCard title="Fibra" value={String(stats.fiber)} icon={<Wifi className="h-5 w-5" />} />
          <StatsCard title="Radio" value={String(stats.radio)} icon={<AlertTriangle className="h-5 w-5" />} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <div className="glass-card rounded-xl p-1.5 overflow-x-auto">
            <TabsList className="grid w-full grid-cols-10 bg-transparent min-w-[640px]">
              {[
                { value: 'users', icon: Users, label: 'Clientes' },
                { value: 'plans', icon: Wifi, label: 'Planes' },
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

          <TabsContent value="users">
            <AdminUsersPanel profiles={profiles} userRoles={userRoles} onRefresh={fetchAllData} makeUserAdmin={makeUserAdmin} />
          </TabsContent>

          <TabsContent value="plans"><ServicePlansPanel /></TabsContent>
          <TabsContent value="tickets"><AdminTicketsPanel /></TabsContent>
          <TabsContent value="notifications"><AdminNotificationsPanel /></TabsContent>
          <TabsContent value="withdrawals"><WithdrawalRequestsPanel /></TabsContent>
          <TabsContent value="traffic"><LiveTrafficMonitor /></TabsContent>
          <TabsContent value="suspension"><MassSuspension /></TabsContent>
          <TabsContent value="odoo"><OdooIntegrationPanel /></TabsContent>

          <TabsContent value="stats">
            <div className="glass-card rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Resumen General</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Total Usuarios', value: stats.total, desc: 'Contratos registrados' },
                  { title: 'Administradores', value: stats.admins, desc: 'Con acceso al panel' },
                  { title: 'Usuarios Activos', value: stats.active, desc: `${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}% del total` },
                  { title: 'Suspendidos', value: stats.suspended, desc: 'Servicio cortado' },
                  { title: 'Cortes en 7 días', value: stats.upcomingCuts, desc: 'Clientes próximos a corte' },
                  { title: 'Deuda Acumulada', value: `$${stats.totalDebt.toFixed(2)}`, desc: 'Balance pendiente total' },
                ].map(({ title, value, desc }) => (
                  <div key={title} className="glass-card rounded-xl p-6 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-4xl font-bold gradient-text">{value}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
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
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke('auto-suspend-accounts');
                      if (error) throw error;
                      toast({ title: 'Ejecutado', description: `Verificación completada: ${JSON.stringify(data)}` });
                    } catch (error: any) {
                      toast({ title: 'Error', description: error.message, variant: 'destructive' });
                    }
                  }}
                >
                  Ejecutar Verificación de Cortes
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
