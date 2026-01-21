import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, FileText } from 'lucide-react';

interface CancelServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  contractNumber: string;
  onCancellationRequested: () => void;
}

const CancelServiceDialog = ({
  open,
  onOpenChange,
  userId,
  contractNumber,
  onCancellationRequested
}: CancelServiceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmations, setConfirmations] = useState({
    understand: false,
    equipment: false,
    balance: false
  });
  const { toast } = useToast();

  const allConfirmed = confirmations.understand && confirmations.equipment && confirmations.balance;

  const handleConfirmationChange = (key: keyof typeof confirmations) => {
    setConfirmations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmitCancellation = async () => {
    if (!allConfirmed || !reason.trim()) {
      toast({
        title: "Error",
        description: "Debe completar todos los requisitos y proporcionar un motivo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create a support ticket for the cancellation request
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          title: `Solicitud de Retiro - ${contractNumber}`,
          description: `SOLICITUD DE CANCELACIÓN DE SERVICIO

Contrato: ${contractNumber}

Motivo del retiro:
${reason}

Confirmaciones del cliente:
✓ Entiende que el servicio será suspendido
✓ Se compromete a devolver equipos en préstamo
✓ Acepta liquidar saldo pendiente

Esta solicitud requiere revisión y aprobación del administrador.`,
          ticket_type: 'Solicitudes de servicio',
          priority: 'high',
          status: 'open'
        });

      if (ticketError) throw ticketError;

      toast({
        title: "Solicitud enviada",
        description: "Se ha creado un ticket para procesar tu solicitud de retiro. Un agente te contactará pronto.",
      });

      // Reset form
      setReason('');
      setConfirmations({ understand: false, equipment: false, balance: false });
      
      onCancellationRequested();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting cancellation:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Solicitar Retiro del Servicio
          </DialogTitle>
          <DialogDescription>
            Contrato: {contractNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta acción iniciará el proceso de cancelación de tu servicio de internet. 
              Un representante revisará tu solicitud y te contactará.
            </AlertDescription>
          </Alert>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo del retiro *</Label>
            <Textarea
              id="reason"
              placeholder="Por favor, indícanos el motivo por el cual deseas cancelar el servicio..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          {/* Required Confirmations */}
          <div className="space-y-3 bg-secondary/20 rounded-lg p-4">
            <p className="font-semibold text-foreground text-sm">Requisitos para el retiro:</p>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="understand"
                checked={confirmations.understand}
                onCheckedChange={() => handleConfirmationChange('understand')}
              />
              <label htmlFor="understand" className="text-sm text-muted-foreground cursor-pointer">
                Entiendo que mi servicio de internet será <strong>suspendido</strong> una vez procesada la solicitud.
              </label>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="equipment"
                checked={confirmations.equipment}
                onCheckedChange={() => handleConfirmationChange('equipment')}
              />
              <label htmlFor="equipment" className="text-sm text-muted-foreground cursor-pointer">
                Me comprometo a <strong>devolver todos los equipos</strong> proporcionados en préstamo (router, ONT, antena, etc.).
              </label>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="balance"
                checked={confirmations.balance}
                onCheckedChange={() => handleConfirmationChange('balance')}
              />
              <label htmlFor="balance" className="text-sm text-muted-foreground cursor-pointer">
                Acepto <strong>liquidar cualquier saldo pendiente</strong> antes de la cancelación definitiva.
              </label>
            </div>
          </div>

          {/* Ticket Info */}
          <div className="flex items-start gap-3 bg-primary/10 rounded-lg p-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="text-foreground font-medium">Se creará un ticket de soporte</p>
              <p className="text-muted-foreground">
                Un agente revisará tu solicitud y te contactará para coordinar la devolución de equipos y liquidación.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleSubmitCancellation} 
            disabled={loading || !allConfirmed || !reason.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitud'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CancelServiceDialog;
