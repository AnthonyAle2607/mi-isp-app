import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Ticket, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  ticket_type: 'technical' | 'billing' | 'service';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}

const SupportTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ticket_type: 'technical' as const,
    priority: 'medium' as const
  });

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data as SupportTicket[]) || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([{
          user_id: user?.id,
          ...formData
        }]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Ticket creado exitosamente",
      });

      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        ticket_type: 'technical',
        priority: 'medium'
      });
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el ticket",
        variant: "destructive",
      });
    }
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

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      technical: 'Técnico',
      billing: 'Facturación',
      service: 'Servicio'
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Tickets de Soporte
            </CardTitle>
            <CardDescription>
              Gestiona tus solicitudes y reportes
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Ticket</DialogTitle>
                <DialogDescription>
                  Describe tu problema o solicitud
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Breve descripción del problema"
                    maxLength={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.ticket_type}
                    onValueChange={(value: any) => setFormData({ ...formData, ticket_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Soporte Técnico</SelectItem>
                      <SelectItem value="billing">Facturación y Pagos</SelectItem>
                      <SelectItem value="service">Solicitud de Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe detalladamente tu problema o solicitud"
                    rows={5}
                    maxLength={1000}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Crear Ticket
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tienes tickets aún</p>
            <p className="text-sm text-muted-foreground">Crea uno para reportar problemas o solicitudes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-4 space-y-3 bg-card/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{ticket.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(ticket.status)}
                  {getTypeBadge(ticket.ticket_type)}
                  <Badge variant="outline" className="text-xs">
                    {ticket.priority === 'urgent' ? '🔴 Urgente' : 
                     ticket.priority === 'high' ? '🟠 Alta' : 
                     ticket.priority === 'medium' ? '🟡 Media' : '🟢 Baja'}
                  </Badge>
                </div>

                {ticket.admin_response && (
                  <div className="bg-secondary/20 rounded-lg p-3 border-l-4 border-primary">
                    <p className="text-xs font-semibold text-primary mb-1">Respuesta del Administrador:</p>
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
  );
};

export default SupportTickets;
