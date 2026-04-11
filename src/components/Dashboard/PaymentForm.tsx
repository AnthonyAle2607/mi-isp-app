import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CreditCard, Phone, Hash, Building2, CheckCircle2 } from "lucide-react";
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
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const banks = [
    { name: "Banco Provincial", color: "from-blue-500 to-blue-600" },
    { name: "Banplus", color: "from-green-500 to-green-600" },
    { name: "Banesco", color: "from-emerald-500 to-teal-600" },
    { name: "BNC", color: "from-red-500 to-red-600" },
    { name: "BDV", color: "from-indigo-500 to-indigo-600" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
      title: "✅ Pago registrado exitosamente",
      description: "Tu pago está en proceso de verificación. Recibirás una notificación cuando sea confirmado.",
    });
    setLoading(false);
    onSuccess();
    onClose();
  };

  const isStep1Valid = bank && amount;
  const isStep2Valid = referenceNumber && paymentDate;
  const isStep3Valid = phone;

  const totalSteps = 3;
  const progressWidth = (step / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary/15 to-primary/5 p-5 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/15">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Registrar Pago</h2>
            <p className="text-xs text-muted-foreground">Paso {step} de {totalSteps}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-1 bg-secondary/30 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressWidth}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5">
        {/* Step 1: Bank & Amount */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-200">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Banco
              </Label>
              <Select value={bank} onValueChange={setBank}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Selecciona tu banco" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${b.color}`} />
                        {b.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                Monto (Bs)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Bs.</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-12 rounded-xl pl-12 text-lg font-semibold"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 mt-2"
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2: Reference & Date */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-200">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Número de Referencia
              </Label>
              <Input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Ej: 1234567890"
                className="h-12 rounded-xl font-mono tracking-wider"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Fecha de Pago
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 rounded-xl justify-start text-left font-normal",
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

            <div className="flex gap-3 mt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl">
                Atrás
              </Button>
              <Button type="button" onClick={() => setStep(3)} disabled={!isStep2Valid} className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Phone & Confirm */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-200">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Número de Teléfono
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="04XX-XXXXXXX"
                className="h-12 rounded-xl"
              />
            </div>

            {/* Summary */}
            <div className="bg-secondary/20 rounded-xl p-4 space-y-2 border border-border/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumen del pago</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Banco</span>
                  <span className="font-medium text-foreground">{bank}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monto</span>
                  <span className="font-bold text-foreground">Bs. {parseFloat(amount || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Referencia</span>
                  <span className="font-mono text-foreground">{referenceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fecha</span>
                  <span className="text-foreground">{paymentDate ? format(paymentDate, "dd/MM/yyyy") : '-'}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl">
                Atrás
              </Button>
              <Button
                type="submit"
                disabled={loading || !isStep3Valid}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registrando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar Pago
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PaymentForm;
