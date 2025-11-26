import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Ticket, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  ticket_type: string;
  status: string;
  priority: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    phone: string;
  };
}

const AdminTicketsPanel = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    try {
      const updates: any = { updated_at: new Date().toISOString() };
      
      if (response.trim()) {
        updates.admin_response = response;
      }
      
      if (newStatus) {
        updates.status = newStatus;
        if (newStatus === 'resolved' || newStatus === 'closed') {
          updates.resolved_at = new Date().toISOString();
        }
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', selectedTicket.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Ticket actualizado exitosamente",
      });

      setIsDialogOpen(false);
      setResponse('');
      setNewStatus('');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el ticket",
        variant: "destructive",
      });
    }
  };

  const openTicketDialog = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponse(ticket.admin_response || '');
    setNewStatus(ticket.status);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { variant: 'default', icon: Clock, color: 'text-blue-500' },
      in_progress: { variant: 'secondary', icon: AlertCircle, color: 'text-yellow-500' },
      resolved: { variant: 'default', icon: CheckCircle2, color: 'text-green-500' },
      closed: { variant: 'outline', icon: CheckCircle2, color: 'text-gray-500' }
    };
    
    const config = variants[status] || variants.open;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status === 'open' ? 'Abierto' : 
         status === 'in_progress' ? 'En Progreso' : 
         status === 'resolved' ? 'Resuelto' : 'Cerrado'}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 border-red-500/30';
      case 'high': return 'bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'bg-green-500/10 border-green-500/30';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Cargando tickets...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Gestión de Tickets de Soporte
          </CardTitle>
          <CardDescription>
            Administra todas las solicitudes de los usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay tickets registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className={`border rounded-lg p-4 space-y-3 ${getPriorityColor(ticket.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">{ticket.title}</h4>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <span className="font-medium">Usuario:</span> {ticket.profiles?.full_name || 'Sin nombre'}
                        {ticket.profiles?.phone && (
                          <>
                            <span>•</span>
                            <span>{ticket.profiles.phone}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {ticket.ticket_type === 'technical' ? 'Técnico' : 
                           ticket.ticket_type === 'billing' ? 'Facturación' : 'Servicio'}
                        </span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {ticket.priority === 'urgent' ? 'Urgente' : 
                           ticket.priority === 'high' ? 'Alta' : 
                           ticket.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => openTicketDialog(ticket)}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Responder
                    </Button>
                  </div>

                  {ticket.admin_response && (
                    <div className="bg-primary/10 rounded-lg p-3 border-l-4 border-primary">
                      <p className="text-xs font-semibold text-primary mb-1">Respuesta:</p>
                      <p className="text-sm text-foreground">{ticket.admin_response}</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Creado: {format(new Date(ticket.created_at), 'PPp', { locale: es })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestionar Ticket</DialogTitle>
            <DialogDescription>
              {selectedTicket?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-secondary/20 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Descripción del usuario:</p>
              <p className="text-sm text-muted-foreground">{selectedTicket?.description}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="response">Respuesta al Usuario</Label>
              <Textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                rows={6}
              />
            </div>

            <Button onClick={handleUpdateTicket} className="w-full">
              Actualizar Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminTicketsPanel;
