import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from "@/components/Layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Network, 
  Activity, 
  DollarSign, 
  Settings, 
  Shield,
  Ticket,
  Ban,
  BarChart3
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const adminModules = [
    {
      title: 'Panel de Administración',
      description: 'Gestión de usuarios, roles y configuración',
      icon: <Shield className="h-8 w-8" />,
      color: 'from-primary to-primary/70',
      route: '/admin'
    },
    {
      title: 'Gestión de Red',
      description: 'Monitoreo de dispositivos y topología',
      icon: <Network className="h-8 w-8" />,
      color: 'from-cyan-500 to-cyan-600',
      route: '/network'
    },
    {
      title: 'Monitor de Tráfico',
      description: 'Ver consumo de clientes en tiempo real',
      icon: <Activity className="h-8 w-8" />,
      color: 'from-success-green to-emerald-600',
      route: '/admin?tab=traffic'
    },
    {
      title: 'Corte Masivo',
      description: 'Suspender servicios por deudas',
      icon: <Ban className="h-8 w-8" />,
      color: 'from-destructive to-red-600',
      route: '/admin?tab=suspension'
    },
    {
      title: 'Tickets de Soporte',
      description: 'Gestionar solicitudes de clientes',
      icon: <Ticket className="h-8 w-8" />,
      color: 'from-amber-500 to-amber-600',
      route: '/admin?tab=tickets'
    },
    {
      title: 'Estadísticas',
      description: 'Reportes y métricas del negocio',
      icon: <BarChart3 className="h-8 w-8" />,
      color: 'from-purple-500 to-purple-600',
      route: '/admin?tab=stats'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(216,71%,6%)] via-background to-[hsl(216,71%,12%)]">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-white">Centro de Administración</span>
            <span className="text-primary">Silverdata</span>
          </h1>
          <p className="text-muted-foreground">
            Gestiona todos los aspectos de tu ISP desde un solo lugar
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">--</p>
              <p className="text-xs text-muted-foreground">Clientes</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <Network className="h-6 w-6 mx-auto mb-2 text-cyan-400" />
              <p className="text-2xl font-bold text-foreground">--</p>
              <p className="text-xs text-muted-foreground">Dispositivos</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <Ticket className="h-6 w-6 mx-auto mb-2 text-amber-400" />
              <p className="text-2xl font-bold text-foreground">--</p>
              <p className="text-xs text-muted-foreground">Tickets abiertos</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-success-green" />
              <p className="text-2xl font-bold text-foreground">--</p>
              <p className="text-xs text-muted-foreground">Con deuda</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminModules.map((module, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-border/50 overflow-hidden"
              onClick={() => navigate(module.route)}
            >
              <CardHeader className={`bg-gradient-to-r ${module.color} text-white pb-4`}>
                <div className="flex items-center gap-3">
                  {module.icon}
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">{module.description}</p>
                <Button 
                  variant="ghost" 
                  className="mt-3 w-full justify-start text-primary hover:text-primary"
                >
                  Acceder →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
