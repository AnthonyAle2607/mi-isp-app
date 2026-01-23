import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Loader2, CheckCircle2, XCircle, Clock, User, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface WithdrawalTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  admin_response: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    contract_number: string | null;
    phone: string | null;
    address: string | null;
    pending_balance: number | null;
    plan_type: string | null;
  };
}

const WithdrawalRequestsPanel = () => {
  const [tickets, setTickets] = useState<WithdrawalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<WithdrawalTicket | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithdrawalTickets();
  }, []);

  const fetchWithdrawalTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles:user_id (
            full_name,
            contract_number,
            phone,
            address,
            pending_balance,
            plan_type
          )
        `)
        .eq('ticket_type', 'service')
        .ilike('title', '%retiro%')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data as WithdrawalTicket[]) || []);
    } catch (error) {
      console.error('Error fetching withdrawal tickets:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes de retiro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (ticket: WithdrawalTicket) => {
    setSelectedTicket(ticket);
    setResponse(ticket.admin_response || '');
    setNewStatus(ticket.status);
    setDialogOpen(true);
  };

  const handleApproveWithdrawal = async () => {
    if (!selectedTicket) return;

    setUpdating(true);
    try {
      // Update the ticket status
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          admin_response: response,
          resolved_at: ['resolved', 'closed'].includes(newStatus) ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (ticketError) throw ticketError;

      // If approved/closed, suspend the user's account
      if (newStatus === 'closed') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            account_status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', selectedTicket.user_id);

        if (profileError) throw profileError;
      }

      toast({
        title: "Éxito",
        description: newStatus === 'closed' 
          ? "Retiro procesado. El servicio ha sido desactivado." 
          : "Solicitud actualizada correctamente",
      });

      setDialogOpen(false);
      fetchWithdrawalTickets();
    } catch (error) {
      console.error('Error updating withdrawal request:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      open: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
      in_progress: { variant: 'default', icon: <Clock className="h-3 w-3" /> },
      resolved: { variant: 'secondary', icon: <CheckCircle2 className="h-3 w-3" /> },
      closed: { variant: 'outline', icon: <XCircle className="h-3 w-3" /> }
    };

    const config = statusConfig[status] || statusConfig.open;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status === 'open' && 'Pendiente'}
        {status === 'in_progress' && 'En Proceso'}
        {status === 'resolved' && 'Resuelto'}
        {status === 'closed' && 'Cerrado'}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'high') {
      return <Badge variant="destructive">Alta Prioridad</Badge>;
    }
    if (priority === 'medium') {
      return <Badge variant="secondary">Media</Badge>;
    }
    return <Badge variant="outline">Baja</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando solicitudes...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle>Solicitudes de Retiro de Servicio</CardTitle>
              <CardDescription>
                Gestiona las solicitudes de cancelación y retiro de contratos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LogOut className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay solicitudes de retiro pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{ticket.title}</h3>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{ticket.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3 p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{ticket.profiles?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{ticket.profiles?.contract_number || 'Sin contrato'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(ticket.created_at), "dd MMM yyyy", { locale: es })}</span>
                        </div>
                        <div>
                          <span className="font-medium">Saldo: </span>
                          <span className={ticket.profiles?.pending_balance && ticket.profiles.pending_balance > 0 ? 'text-destructive font-bold' : 'text-green-600'}>
                            ${(ticket.profiles?.pending_balance || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {ticket.admin_response && (
                        <div className="mt-2 p-2 bg-primary/5 border-l-2 border-primary rounded text-sm">
                          <span className="font-medium">Respuesta Admin: </span>
                          {ticket.admin_response}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(ticket)}
                    >
                      Gestionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Management Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              Procesar Solicitud de Retiro
            </DialogTitle>
            <DialogDescription>
              Cliente: {selectedTicket?.profiles?.full_name} - {selectedTicket?.profiles?.contract_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div><strong>Plan:</strong> {selectedTicket?.profiles?.plan_type || 'N/A'}</div>
              <div><strong>Teléfono:</strong> {selectedTicket?.profiles?.phone || 'N/A'}</div>
              <div><strong>Dirección:</strong> {selectedTicket?.profiles?.address || 'N/A'}</div>
              <div>
                <strong>Saldo pendiente:</strong>{' '}
                <span className={selectedTicket?.profiles?.pending_balance && selectedTicket.profiles.pending_balance > 0 ? 'text-destructive font-bold' : 'text-green-600'}>
                  ${(selectedTicket?.profiles?.pending_balance || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado de la Solicitud</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Proceso</SelectItem>
                  <SelectItem value="resolved">Resuelto (mantener servicio)</SelectItem>
                  <SelectItem value="closed">Cerrado (desactivar servicio)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_response">Respuesta / Observaciones</Label>
              <Textarea
                id="admin_response"
                placeholder="Agregar observaciones sobre el proceso de retiro..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
              />
            </div>

            {newStatus === 'closed' && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Al cerrar esta solicitud, el servicio del cliente será desactivado automáticamente.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={updating}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApproveWithdrawal} 
              disabled={updating}
              variant={newStatus === 'closed' ? 'destructive' : 'default'}
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                newStatus === 'closed' ? 'Confirmar Retiro' : 'Guardar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WithdrawalRequestsPanel;
