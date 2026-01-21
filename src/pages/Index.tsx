import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Layout/Header";
import StatsCard from "@/components/Dashboard/StatsCard";
import SpeedTest from "@/components/Dashboard/SpeedTest";
import NetworkInfo from "@/components/Dashboard/NetworkInfo";
import PaymentHistory from "@/components/Dashboard/PaymentHistory";
import PaymentReceipt from "@/components/Dashboard/PaymentReceipt";
import DataUsage from "@/components/Dashboard/DataUsage";
import PaymentMethods from "@/components/Dashboard/PaymentMethods";
import SupportTickets from "@/components/Dashboard/SupportTickets";
import AccountStatus from "@/components/Dashboard/AccountStatus";
import SupportChatbot from "@/components/Dashboard/SupportChatbot";
import ChangePlanDialog from "@/components/Dashboard/ChangePlanDialog";
import CancelServiceDialog from "@/components/Dashboard/CancelServiceDialog";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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

interface ProfileData {
  plan_type: string;
  contract_number: string;
  pending_balance: number;
  plan_id: string | null;
  connection_type: 'fibra' | 'radio';
  next_billing_date: string | null;
}

const Index = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData>({
    plan_type: 'basic',
    contract_number: '',
    pending_balance: 0,
    plan_id: null,
    connection_type: 'fibra',
    next_billing_date: null
  });
  const [lastSpeedTest, setLastSpeedTest] = useState<number | null>(null);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [cancelServiceOpen, setCancelServiceOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && user && isAdmin) {
      navigate('/admin-home');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_type, contract_number, pending_balance, plan_id, connection_type, next_billing_date')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfileData({
          plan_type: data.plan_type || 'Sin plan',
          contract_number: data.contract_number || 'No asignado',
          pending_balance: data.pending_balance || 0,
          plan_id: data.plan_id,
          connection_type: (data.connection_type as 'fibra' | 'radio') || 'fibra',
          next_billing_date: data.next_billing_date
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Handle speed test completion
  const handleSpeedTestComplete = (downloadSpeed: number) => {
    setLastSpeedTest(downloadSpeed);
  };

  // Format next billing date
  const formatBillingDate = () => {
    if (!profileData.next_billing_date) return 'No definida';
    const date = new Date(profileData.next_billing_date);
    return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(216,71%,6%)] via-background to-[hsl(216,71%,12%)]">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Welcome Section */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            <span className="text-white">Bienvenido a </span>
            <span className="text-primary">Silverdata</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Internet ilimitado para toda la familia • Estabilidad garantizada
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatsCard
            title="Plan Actual"
            value={profileData.plan_type}
            subtitle={`Contrato: ${profileData.contract_number}`}
            icon={<Wifi className="h-6 w-6" />}
            trend="up"
          />
          
          <StatsCard
            title="Saldo Pendiente"
            value={`$${profileData.pending_balance.toFixed(2)}`}
            subtitle={`Vence: ${formatBillingDate()}`}
            icon={<DollarSign className="h-6 w-6" />}
            trend={profileData.pending_balance > 0 ? "down" : "up"}
            className={profileData.pending_balance > 0 ? "border-warning-orange/20" : "border-success-green/20"}
          />
          
          <StatsCard
            title="Velocidad Actual"
            value={lastSpeedTest ? `${lastSpeedTest.toFixed(1)} Mbps` : "Sin medir"}
            subtitle={lastSpeedTest ? "Última medición" : "Ejecuta un test"}
            icon={<TrendingUp className="h-6 w-6" />}
            trend={lastSpeedTest ? "up" : "neutral"}
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

        {/* Payment Methods Section - Destacado */}
        <PaymentMethods />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <SpeedTest onTestComplete={handleSpeedTestComplete} />
            <NetworkInfo />
            
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
                
                <button 
                  onClick={() => setChangePlanOpen(true)}
                  className="w-full p-3 text-left bg-secondary/20 hover:bg-secondary/30 rounded-lg border border-border/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Wifi className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Cambiar Plan</p>
                      <p className="text-sm text-muted-foreground">Explora nuestros planes disponibles</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => {
                    const ticketsSection = document.querySelector('[data-tickets-section]');
                    ticketsSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full p-3 text-left bg-secondary/20 hover:bg-secondary/30 rounded-lg border border-border/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Reportar Incidencia</p>
                      <p className="text-sm text-muted-foreground">¿Tienes problemas? Repórtalo aquí</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => setCancelServiceOpen(true)}
                  className="w-full p-3 text-left bg-destructive/10 hover:bg-destructive/20 rounded-lg border border-destructive/30 transition-colors"
                >
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

          <div className="space-y-4 sm:space-y-6">
            <div data-tickets-section>
              <AccountStatus />
            </div>
            <SupportTickets />
            <PaymentHistory />
            <DataUsage />
            <PaymentReceipt />
          </div>
        </div>
      </main>
      
      {/* Chatbot de soporte con IA */}
      <SupportChatbot />

      {/* Dialogs */}
      <ChangePlanDialog
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        currentPlanId={profileData.plan_id}
        currentBalance={profileData.pending_balance}
        connectionType={profileData.connection_type}
        userId={user?.id || ''}
        onPlanChanged={fetchProfileData}
      />

      <CancelServiceDialog
        open={cancelServiceOpen}
        onOpenChange={setCancelServiceOpen}
        userId={user?.id || ''}
        contractNumber={profileData.contract_number}
        onCancellationRequested={fetchProfileData}
      />
    </div>
  );
};

export default Index;
