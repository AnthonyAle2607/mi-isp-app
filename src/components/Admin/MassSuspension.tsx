import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Ban, CheckCircle, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DebtorProfile {
  id: string;
  user_id: string;
  full_name: string;
  ip_address: string;
  plan_type: string;
  account_status: string;
  last_payment_date: string | null;
  next_billing_date: string | null;
}

const MassSuspension = () => {
  const { toast } = useToast();
  const [debtors, setDebtors] = useState<DebtorProfile[]>([]);
  const [selectedDebtors, setSelectedDebtors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspending, setSuspending] = useState(false);

  useEffect(() => {
    fetchDebtors();
  }, []);

  const fetchDebtors = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Buscar usuarios activos que no han pagado este mes
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_status', 'active')
        .or(`last_payment_date.is.null,last_payment_date.lt.${startOfMonth.toISOString()}`);

      if (error) throw error;

      setDebtors(data || []);
    } catch (error) {
      console.error('Error fetching debtors:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios con deuda",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDebtors.length === debtors.length) {
      setSelectedDebtors([]);
    } else {
      setSelectedDebtors(debtors.map(d => d.user_id));
    }
  };

  const toggleDebtor = (userId: string) => {
    setSelectedDebtors(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const executeMassSuspension = async () => {
    if (selectedDebtors.length === 0) {
      toast({
        title: "Advertencia",
        description: "Selecciona al menos un usuario para suspender",
        variant: "destructive",
      });
      return;
    }

    setSuspending(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          account_status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .in('user_id', selectedDebtors);

      if (error) throw error;

      toast({
        title: "Corte masivo ejecutado",
        description: `Se suspendieron ${selectedDebtors.length} cuentas exitosamente`,
      });

      setSelectedDebtors([]);
      fetchDebtors();
    } catch (error: any) {
      console.error('Error suspending accounts:', error);
      toast({
        title: "Error",
        description: error.message || "Error al ejecutar el corte masivo",
        variant: "destructive",
      });
    } finally {
      setSuspending(false);
    }
  };

  const getDaysSincePayment = (lastPayment: string | null) => {
    if (!lastPayment) return 'Nunca';
    const days = Math.floor((Date.now() - new Date(lastPayment).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} días`;
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Ban className="h-5 w-5" />
          Corte Masivo por Deudas
        </CardTitle>
        <CardDescription>
          Suspende el servicio a todos los clientes que no han pagado en el mes actual
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-secondary/30 rounded-lg p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">{debtors.length}</p>
            <p className="text-xs text-muted-foreground">Con deuda</p>
          </div>
          <div className="bg-secondary/30 rounded-lg p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{selectedDebtors.length}</p>
            <p className="text-xs text-muted-foreground">Seleccionados</p>
          </div>
          <div className="bg-destructive/20 rounded-lg p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{selectedDebtors.length}</p>
            <p className="text-xs text-muted-foreground">A suspender</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={debtors.length > 0 && selectedDebtors.length === debtors.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">Seleccionar todos</span>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={selectedDebtors.length === 0 || suspending}
              >
                <Ban className="h-4 w-4 mr-2" />
                Ejecutar Corte Masivo ({selectedDebtors.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirmar Corte Masivo
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción suspenderá el servicio de <strong>{selectedDebtors.length}</strong> clientes.
                  Los clientes afectados no podrán acceder a internet hasta que realicen su pago.
                  <br /><br />
                  ¿Estás seguro de continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={executeMassSuspension}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Confirmar Corte
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Debtors list */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando usuarios con deuda...
          </div>
        ) : debtors.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success-green" />
            <p className="text-success-green font-medium">¡Todos los clientes están al día!</p>
            <p className="text-sm text-muted-foreground">No hay usuarios con deudas pendientes</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto border border-border rounded-lg">
            {debtors.map(debtor => (
              <div
                key={debtor.id}
                className={`p-4 border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors ${
                  selectedDebtors.includes(debtor.user_id) ? 'bg-destructive/10' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedDebtors.includes(debtor.user_id)}
                    onCheckedChange={() => toggleDebtor(debtor.user_id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {debtor.full_name || 'Sin nombre'}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {debtor.plan_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-cyan-400 font-mono">
                        IP: {debtor.ip_address || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Último pago: {getDaysSincePayment(debtor.last_payment_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MassSuspension;
