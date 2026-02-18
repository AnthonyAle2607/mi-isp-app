import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from "@/components/Layout/Header";
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
  BarChart3,
  ChevronRight,
  Link2,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/auth');
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Cargando...
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const adminModules = [
    {
      title: 'Gestión de Usuarios',
      description: 'Administra clientes, roles y configuración del sistema',
      icon: Users,
      accent: 'hsl(var(--primary))',
      accentBg: 'hsl(var(--primary) / 0.1)',
      route: '/admin',
    },
    {
      title: 'Gestión de Red',
      description: 'Monitoreo de dispositivos y topología de red',
      icon: Network,
      accent: 'hsl(var(--tech-blue))',
      accentBg: 'hsl(var(--tech-blue) / 0.1)',
      route: '/network',
    },
    {
      title: 'Monitor de Tráfico',
      description: 'Consumo de clientes en tiempo real',
      icon: Activity,
      accent: 'hsl(var(--success-green))',
      accentBg: 'hsl(var(--success-green) / 0.1)',
      route: '/admin?tab=traffic',
    },
    {
      title: 'Corte Masivo',
      description: 'Suspender servicios por deudas pendientes',
      icon: Ban,
      accent: 'hsl(var(--destructive))',
      accentBg: 'hsl(var(--destructive) / 0.1)',
      route: '/admin?tab=suspension',
    },
    {
      title: 'Tickets de Soporte',
      description: 'Gestionar solicitudes y reclamos de clientes',
      icon: Ticket,
      accent: 'hsl(45 100% 55%)',
      accentBg: 'hsl(45 100% 55% / 0.1)',
      route: '/admin?tab=tickets',
    },
    {
      title: 'Estadísticas',
      description: 'Reportes y métricas del negocio',
      icon: BarChart3,
      accent: 'hsl(270 80% 65%)',
      accentBg: 'hsl(270 80% 65% / 0.1)',
      route: '/admin?tab=stats',
    },
    {
      title: 'Integración Odoo',
      description: 'Importar clientes y facturas desde Odoo',
      icon: Link2,
      accent: 'hsl(200 90% 50%)',
      accentBg: 'hsl(200 90% 50% / 0.1)',
      route: '/admin?tab=odoo',
    },
    {
      title: 'Configuración',
      description: 'Ajustes globales de la plataforma ISP',
      icon: Settings,
      accent: 'hsl(var(--muted-foreground))',
      accentBg: 'hsl(var(--muted) / 0.5)',
      route: '/admin?tab=settings',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 fade-in-up">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-10 glass-card shine">
          {/* Glow accent */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary uppercase tracking-widest">Panel Administrativo</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                Centro de Administración <span className="gradient-text">Silverdata</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Gestiona todos los aspectos de tu ISP desde un solo lugar
              </p>
            </div>
          </div>
        </div>

        {/* Modules grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Módulos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.title}
                  onClick={() => navigate(mod.route)}
                  className="group glass-card rounded-xl p-5 text-left hover:border-white/20 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div
                    className="inline-flex p-3 rounded-xl mb-4 transition-transform group-hover:scale-110"
                    style={{ background: mod.accentBg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: mod.accent }} />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {mod.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: mod.accent }}>
                    Acceder <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick stats placeholder */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Resumen Rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Clientes", color: "primary" },
              { icon: Network, label: "Dispositivos", color: "tech-blue" },
              { icon: Ticket, label: "Tickets abiertos", color: "warning-orange" },
              { icon: DollarSign, label: "Con deuda", color: "destructive" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="glass-card rounded-xl p-5 flex flex-col gap-2">
                <Icon className={`h-5 w-5 text-${color}`} />
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
