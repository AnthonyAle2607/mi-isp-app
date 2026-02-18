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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 fade-in-up">

        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 glass-card shine">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Portal de Cliente</p>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                Bienvenido a <span className="gradient-text">Silverdata</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Internet ilimitado · Estabilidad garantizada
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setChangePlanOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-medium transition-all"
              >
                Cambiar Plan
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Plan Actual"
            value={profileData.plan_type}
            subtitle={`Contrato: ${profileData.contract_number}`}
            icon={<Wifi className="h-5 w-5" />}
            trend="up"
          />
          <StatsCard
            title="Saldo Pendiente"
            value={`$${profileData.pending_balance.toFixed(2)}`}
            subtitle={`Vence: ${formatBillingDate()}`}
            icon={<DollarSign className="h-5 w-5" />}
            trend={profileData.pending_balance > 0 ? "down" : "up"}
            className={profileData.pending_balance > 0 ? "border-warning-orange/20" : "border-success-green/20"}
          />
          <StatsCard
            title="Velocidad Actual"
            value={lastSpeedTest ? `${lastSpeedTest.toFixed(1)} Mbps` : "Sin medir"}
            subtitle={lastSpeedTest ? "Última medición" : "Ejecuta un test"}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={lastSpeedTest ? "up" : "neutral"}
          />
          <StatsCard
            title="Estado de Red"
            value="Óptimo"
            subtitle="99.8% uptime"
            icon={<Activity className="h-5 w-5" />}
            trend="up"
            className="border-success-green/20"
          />
        </div>

        {/* Payment Methods */}
        <PaymentMethods />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Left column */}
          <div className="space-y-6">
            <SpeedTest onTestComplete={handleSpeedTestComplete} />
            <NetworkInfo />

            {/* Network Status */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Estado de la Red en Tiempo Real
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Download, label: "Descarga", value: "98.5%", color: "success-green" },
                  { icon: Upload, label: "Subida", value: "96.8%", color: "success-green" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="rounded-xl bg-secondary/20 p-4 text-center space-y-1">
                    <Icon className={`h-5 w-5 text-${color} mx-auto`} />
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold text-foreground">{value}</p>
                    <span className={`text-xs text-${color}`}>Excelente</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                {[
                  { icon: DollarSign, label: "Ver Facturación", desc: "Consulta tu historial de facturas", onClick: () => {}, danger: false },
                  { icon: Wifi, label: "Cambiar Plan", desc: "Explora nuestros planes disponibles", onClick: () => setChangePlanOpen(true), danger: false },
                  { icon: AlertTriangle, label: "Reportar Incidencia", desc: "¿Tienes problemas? Repórtalo aquí", onClick: () => { document.querySelector('[data-tickets-section]')?.scrollIntoView({ behavior: 'smooth' }); }, danger: false },
                  { icon: UserX, label: "Retirar Servicio", desc: "Cancelar tu plan de internet", onClick: () => setCancelServiceOpen(true), danger: true },
                ].map(({ icon: Icon, label, desc, onClick, danger }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all group ${
                      danger
                        ? 'bg-destructive/5 hover:bg-destructive/10 border border-destructive/20'
                        : 'bg-secondary/20 hover:bg-secondary/30 border border-border/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${danger ? 'bg-destructive/10' : 'bg-primary/10 group-hover:bg-primary/15'}`}>
                      <Icon className={`h-4 w-4 ${danger ? 'text-destructive' : 'text-primary'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
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

      <SupportChatbot />

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
