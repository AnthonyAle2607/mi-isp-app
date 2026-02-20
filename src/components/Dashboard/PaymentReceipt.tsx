import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface PaymentReceiptData {
  id: string;
  amount: number;
  payment_date: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  receipt_url: string;
  admin_notes?: string;
  created_at: string;
}

const PaymentReceipt = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receipts, setReceipts] = useState<PaymentReceiptData[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: '',
    file: null as File | null
  });

  const fetchReceipts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment-receipt', {
        method: 'GET',
        body: new URLSearchParams({ user_id: user.id })
      });

      if (error) throw error;
      
      setReceipts(data.receipts || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los comprobantes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.file || !formData.amount || !formData.payment_date) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const submitFormData = new FormData();
      submitFormData.append('file', formData.file);
      submitFormData.append('amount', formData.amount);
      submitFormData.append('payment_date', formData.payment_date);
      submitFormData.append('user_id', user.id);

      const { data, error } = await supabase.functions.invoke('verify-payment-receipt', {
        method: 'POST',
        body: submitFormData
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Comprobante subido correctamente. Será verificado por nuestro equipo.",
      });

      setFormData({ amount: '', payment_date: '', file: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setOpen(false);
      fetchReceipts();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el comprobante. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success-green" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning-orange" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success-green/10 text-success-green border-success-green/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-warning-orange/10 text-warning-orange border-warning-orange/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      default:
        return 'Pendiente';
    }
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary" />
          Comprobantes de Pago
        </h3>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={fetchReceipts}>
              <Upload className="h-4 w-4 mr-2" />
              Subir Comprobante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Subir Comprobante de Pago</DialogTitle>
              <DialogDescription>
                Sube tu comprobante de pago para verificación
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto Pagado</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Ej: 45000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Fecha de Pago</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Comprobante (JPG, PNG, PDF)</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  required
                />
              </div>

              <Button type="submit" disabled={uploading} className="w-full">
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  'Subir Comprobante'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Cargando comprobantes...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {receipts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tienes comprobantes subidos
            </p>
          ) : (
            receipts.map((receipt) => (
              <div key={receipt.id} className="bg-secondary/20 rounded-lg p-4 border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      ${receipt.amount.toLocaleString()}
                    </span>
                  </div>
                  <Badge className={getStatusColor(receipt.verification_status)}>
                    {getStatusIcon(receipt.verification_status)}
                    <span className="ml-1">{getStatusText(receipt.verification_status)}</span>
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Fecha de pago: {new Date(receipt.payment_date).toLocaleDateString()}</p>
                  <p>Subido: {new Date(receipt.created_at).toLocaleDateString()}</p>
                  {receipt.admin_notes && (
                    <p className="text-warning-orange">Nota: {receipt.admin_notes}</p>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open(receipt.receipt_url, '_blank')}
                >
                  Ver Comprobante
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentReceipt;