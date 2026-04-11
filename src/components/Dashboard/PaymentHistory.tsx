import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Plus, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PaymentForm from "./PaymentForm";

interface PaymentRecord {
  id: string;
  amount: number | null;
  verification_status: string | null;
  payment_date: string | null;
  created_at: string;
  receipt_url: string;
}

const PaymentHistory = () => {
  const { user } = useAuth();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_receipts')
        .select('id, amount, verification_status, payment_date, created_at, receipt_url')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'verified': return 'Verificado';
      case 'rejected': return 'Rechazado';
      default: return 'Pendiente';
    }
  };

  const getStatusClass = (status: string | null) => {
    switch (status) {
      case 'verified': return 'bg-success-green/10 text-success-green border-success-green/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-warning-orange/10 text-warning-orange border-warning-orange/20';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha';
    return new Date(dateStr).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Historial de Pagos</h3>
              <p className="text-sm text-muted-foreground">Gestiona tus pagos y registra nuevos</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowPaymentForm(true)}
            className="bg-gradient-to-r from-success-green to-success-green-light"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Cargando pagos...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No hay pagos registrados</div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/30">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">{formatDate(payment.payment_date)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Registrado: {formatDate(payment.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <p className="text-lg font-bold text-foreground">
                    ${(payment.amount || 0).toFixed(2)}
                  </p>
                  <Badge variant="secondary" className={getStatusClass(payment.verification_status)}>
                    {getStatusLabel(payment.verification_status)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Form as Dialog */}
        <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
          <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
            <PaymentForm
              onClose={() => setShowPaymentForm(false)}
              onSuccess={fetchPayments}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PaymentHistory;
