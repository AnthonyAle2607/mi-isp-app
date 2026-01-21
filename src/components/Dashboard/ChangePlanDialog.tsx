import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { type ServicePlan, canDowngradePlan, calculateProration, CONNECTION_TYPES } from '@/lib/plans';

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId: string | null;
  currentBalance: number;
  connectionType: 'fibra' | 'radio';
  userId: string;
  onPlanChanged: () => void;
}

const ChangePlanDialog = ({
  open,
  onOpenChange,
  currentPlanId,
  currentBalance,
  connectionType,
  userId,
  onPlanChanged
}: ChangePlanDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPlans();
      setSelectedPlanId('');
    }
  }, [open, connectionType]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('service_plans')
      .select('*')
      .eq('is_active', true)
      .eq('connection_type', connectionType)
      .order('speed_mbps', { ascending: true });
    
    if (!error && data) {
      setPlans(data as ServicePlan[]);
    }
  };

  const currentPlan = plans.find(p => p.id === currentPlanId);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  
  const isUpgrade = selectedPlan && currentPlan && selectedPlan.monthly_price > currentPlan.monthly_price;
  const isDowngrade = selectedPlan && currentPlan && selectedPlan.monthly_price < currentPlan.monthly_price;
  
  const canDowngrade = canDowngradePlan();
  const today = new Date();
  const daysUntilDowngrade = 5 - today.getDate();

  // Calculate proration for upgrades
  const proration = isUpgrade && currentPlan && selectedPlan 
    ? calculateProration(currentPlan.monthly_price, selectedPlan.monthly_price, currentBalance)
    : null;

  const handleChangePlan = async () => {
    if (!selectedPlanId || !selectedPlan) return;
    
    // Block downgrade after day 5
    if (isDowngrade && !canDowngrade) {
      toast({
        title: "No permitido",
        description: "Solo puedes bajar de plan los primeros 5 días del mes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let newBalance = currentBalance;
      
      if (isUpgrade && proration) {
        newBalance = proration.newBalance;
      } else if (isDowngrade) {
        // For downgrades, the new price applies next month
        newBalance = selectedPlan.monthly_price;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          plan_id: selectedPlanId,
          plan_type: selectedPlan.name,
          pending_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Plan actualizado",
        description: isUpgrade 
          ? `Cambiado a ${selectedPlan.name}. Ajuste de $${proration?.adjustment.toFixed(2)} aplicado.`
          : `Cambiado a ${selectedPlan.name}. El nuevo precio aplica desde el próximo ciclo.`,
      });

      onPlanChanged();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error changing plan:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Plan de Servicio</DialogTitle>
          <DialogDescription>
            Conexión: {CONNECTION_TYPES[connectionType]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Plan Info */}
          {currentPlan && (
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Plan actual</p>
              <p className="text-lg font-bold text-foreground">{currentPlan.name}</p>
              <p className="text-sm text-primary">${currentPlan.monthly_price.toFixed(2)}/mes</p>
            </div>
          )}

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label>Nuevo Plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nuevo plan" />
              </SelectTrigger>
              <SelectContent>
                {plans
                  .filter(p => p.id !== currentPlanId)
                  .map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <span className="flex items-center gap-2">
                        {currentPlan && plan.monthly_price > currentPlan.monthly_price ? (
                          <TrendingUp className="h-4 w-4 text-success-green" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-warning-orange" />
                        )}
                        {plan.name} - ${plan.monthly_price.toFixed(2)}/mes
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upgrade Info */}
          {isUpgrade && proration && (
            <div className="bg-success-green/10 border border-success-green/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-success-green">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Mejora de Plan</span>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  Días disfrutados con plan actual: <span className="text-foreground">{proration.daysUsed}</span>
                </p>
                <p className="text-muted-foreground">
                  Días restantes con nuevo plan: <span className="text-foreground">{proration.daysRemaining}</span>
                </p>
                <p className="text-muted-foreground">
                  Ajuste prorrateado: <span className="text-foreground font-bold">+${proration.adjustment.toFixed(2)}</span>
                </p>
                <p className="text-foreground font-bold mt-2">
                  Nuevo saldo: ${proration.newBalance.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Downgrade Warning */}
          {isDowngrade && (
            <>
              {canDowngrade ? (
                <Alert className="border-warning-orange/30 bg-warning-orange/10">
                  <TrendingDown className="h-4 w-4 text-warning-orange" />
                  <AlertDescription className="text-sm">
                    El nuevo precio de <strong>${selectedPlan?.monthly_price.toFixed(2)}/mes</strong> aplicará 
                    desde el próximo ciclo de facturación.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Solo puedes bajar de plan los primeros 5 días del mes.
                    {daysUntilDowngrade < 0 && (
                      <span className="block mt-1">
                        Próxima oportunidad: día 1 del próximo mes.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleChangePlan} 
            disabled={loading || !selectedPlanId || (isDowngrade && !canDowngrade)}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cambiando...
              </>
            ) : (
              'Confirmar Cambio'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePlanDialog;
