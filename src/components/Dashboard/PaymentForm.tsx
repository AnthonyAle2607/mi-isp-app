import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PaymentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentForm = ({ onClose, onSuccess }: PaymentFormProps) => {
  const [bank, setBank] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const banks = [
    "Banco Provincial",
    "Banplus",
    "Banesco",
    "BNC",
    "BDV",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulación de envío
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Pago registrado exitosamente",
      description: "Tu pago está en proceso de verificación. Recibirás una notificación cuando sea confirmado.",
    });

    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-card border border-border">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Registrar Pago</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank">Banco *</Label>
              <Select value={bank} onValueChange={setBank} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu banco" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bankName) => (
                    <SelectItem key={bankName} value={bankName}>
                      {bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="45000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Número de Referencia *</Label>
              <Input
                id="reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Ej: 1234567890"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Pago *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP", { locale: es }) : "Selecciona fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Número de Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="3001234567"
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-success-green to-success-green-light"
                disabled={loading || !bank || !referenceNumber || !amount || !phone || !paymentDate}
              >
                {loading ? "Registrando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default PaymentForm;