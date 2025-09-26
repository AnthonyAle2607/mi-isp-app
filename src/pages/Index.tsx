import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Layout/Header";
import StatsCard from "@/components/Dashboard/StatsCard";
import SpeedTest from "@/components/Dashboard/SpeedTest";
import PaymentHistory from "@/components/Dashboard/PaymentHistory";
import PaymentReceipt from "@/components/Dashboard/PaymentReceipt";
import DataUsage from "@/components/Dashboard/DataUsage";
import { useAuth } from '@/hooks/useAuth';
import { 
  Wifi, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Download,
  Upload,
  UserX
} from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Header />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Bienvenido a tu Portal ISP</h1>
          <p className="text-muted-foreground">
            Gestiona tu conexión, pagos y servicios desde un solo lugar
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Plan Actual"
            value="100 Mbps"
            subtitle="Premium Fiber"
            icon={<Wifi className="h-6 w-6" />}
            trend="up"
          />
          
          <StatsCard
            title="Saldo Pendiente"
            value="$45,000"
            subtitle="Vence: 25 Ene 2024"
            icon={<DollarSign className="h-6 w-6" />}
            trend="neutral"
            className="border-warning-orange/20"
          />
          
          <StatsCard
            title="Velocidad Actual"
            value="87.5 Mbps"
            subtitle="+5% vs mes anterior"
            icon={<TrendingUp className="h-6 w-6" />}
            trend="up"
          />
          
          <StatsCard
            title="Estado de Red"
            value="Óptimo"
            subtitle="99.8% uptime"
            icon={<Activity className="h-6 w-6" />}
            trend="up"
            className="border-success-green/20"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <SpeedTest />
            
            {/* Network Status */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                Estado de la Red en Tiempo Real
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/20 rounded-lg p-4 text-center">
                  <Download className="h-6 w-6 text-success-green mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Descarga</p>
                  <p className="text-xl font-bold text-foreground">98.5%</p>
                  <p className="text-xs text-success-green">Excelente</p>
                </div>
                
                <div className="bg-secondary/20 rounded-lg p-4 text-center">
                  <Upload className="h-6 w-6 text-success-green mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Subida</p>
                  <p className="text-xl font-bold text-foreground">96.8%</p>
                  <p className="text-xs text-success-green">Excelente</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button className="w-full p-3 text-left bg-secondary/20 hover:bg-secondary/30 rounded-lg border border-border/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Ver Facturación</p>
                      <p className="text-sm text-muted-foreground">Consulta tu historial de facturas</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left bg-secondary/20 hover:bg-secondary/30 rounded-lg border border-border/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Wifi className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Cambiar Plan</p>
                      <p className="text-sm text-muted-foreground">Explora nuestros planes disponibles</p>
                    </div>
                  </div>
                </button>

                {/* Payment Methods Section */}
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-primary" />
                    Métodos de Pago
                  </h4>
                  <div className="space-y-2">
                    <button className="w-full p-2 text-left bg-secondary/20 hover:bg-secondary/30 rounded border border-border/30 transition-colors">
                      <p className="text-sm font-medium text-foreground">Transferencia Bancaria</p>
                    </button>
                    <button className="w-full p-2 text-left bg-secondary/20 hover:bg-secondary/30 rounded border border-border/30 transition-colors">
                      <p className="text-sm font-medium text-foreground">PSE</p>
                    </button>
                    <button className="w-full p-2 text-left bg-secondary/20 hover:bg-secondary/30 rounded border border-border/30 transition-colors">
                      <p className="text-sm font-medium text-foreground">Nequi</p>
                    </button>
                    <button className="w-full p-2 text-left bg-secondary/20 hover:bg-secondary/30 rounded border border-border/30 transition-colors">
                      <p className="text-sm font-medium text-foreground">Daviplata</p>
                    </button>
                    <button className="w-full p-2 text-left bg-secondary/20 hover:bg-secondary/30 rounded border border-border/30 transition-colors">
                      <p className="text-sm font-medium text-foreground">Efecty</p>
                    </button>
                  </div>
                </div>
                
                <button className="w-full p-3 text-left bg-secondary/20 hover:bg-secondary/30 rounded-lg border border-border/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Reportar Incidencia</p>
                      <p className="text-sm text-muted-foreground">¿Tienes problemas? Repórtalo aquí</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left bg-destructive/10 hover:bg-destructive/20 rounded-lg border border-destructive/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <UserX className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">Retirar Servicio</p>
                      <p className="text-sm text-muted-foreground">Cancelar tu plan de internet</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <PaymentHistory />
            <DataUsage />
            <PaymentReceipt />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;