import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PaymentHistory = () => {
  const { toast } = useToast();

  const payments = [
    { id: 1, date: "2024-01-15", amount: 45000, status: "Pagado", method: "Tarjeta" },
    { id: 2, date: "2023-12-15", amount: 45000, status: "Pagado", method: "Transferencia" },
    { id: 3, date: "2023-11-15", amount: 45000, status: "Pagado", method: "Tarjeta" },
  ];

  const registerPayment = () => {
    toast({
      title: "Pago registrado",
      description: "Su pago ha sido registrado correctamente y está en proceso de verificación.",
    });
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50">
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
            onClick={registerPayment}
            className="bg-gradient-to-r from-success-green to-success-green-light"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        </div>

        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/30">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">{payment.date}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{payment.method}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <p className="text-lg font-bold text-foreground">
                  ${payment.amount.toLocaleString('es-CO')}
                </p>
                <Badge variant="secondary" className="bg-success-green/10 text-success-green border-success-green/20">
                  {payment.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default PaymentHistory;