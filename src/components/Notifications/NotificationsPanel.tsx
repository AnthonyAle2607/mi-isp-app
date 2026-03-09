import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, CheckCircle, AlertTriangle, CreditCard, MessageSquare, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: 'payment' | 'ticket' | 'system' | 'warning';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const NotificationsPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Listen for payment receipt changes
    const paymentChannel = supabase
      .channel('payment-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'payment_receipts',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const status = payload.new.verification_status;
        if (status === 'verified') {
          addLocalNotification('payment', 'Pago Verificado', 'Tu pago ha sido verificado exitosamente.');
        } else if (status === 'rejected') {
          addLocalNotification('warning', 'Pago Rechazado', 'Tu pago fue rechazado. Contacta soporte.');
        }
      })
      .subscribe();

    // Listen for ticket responses
    const ticketChannel = supabase
      .channel('ticket-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_tickets',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new.admin_response && payload.new.admin_response !== payload.old?.admin_response) {
          addLocalNotification('ticket', 'Ticket Respondido', `Se respondió tu ticket: ${payload.new.title}`);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(paymentChannel);
      supabase.removeChannel(ticketChannel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    // Build notifications from recent payment receipts and tickets
    const [receiptsRes, ticketsRes] = await Promise.all([
      supabase
        .from('payment_receipts')
        .select('id, verification_status, amount, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('support_tickets')
        .select('id, title, status, admin_response, updated_at')
        .eq('user_id', user.id)
        .not('admin_response', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5),
    ]);

    const notifs: Notification[] = [];

    receiptsRes.data?.forEach((r) => {
      if (r.verification_status === 'verified') {
        notifs.push({
          id: `pay-${r.id}`,
          type: 'payment',
          title: 'Pago Verificado',
          message: `Tu pago de $${r.amount || 0} fue verificado.`,
          read: false,
          created_at: r.updated_at,
        });
      } else if (r.verification_status === 'rejected') {
        notifs.push({
          id: `pay-${r.id}`,
          type: 'warning',
          title: 'Pago Rechazado',
          message: `Tu pago de $${r.amount || 0} fue rechazado.`,
          read: false,
          created_at: r.updated_at,
        });
      }
    });

    ticketsRes.data?.forEach((t) => {
      notifs.push({
        id: `ticket-${t.id}`,
        type: 'ticket',
        title: 'Ticket Respondido',
        message: `Respuesta en: ${t.title}`,
        read: false,
        created_at: t.updated_at,
      });
    });

    notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifications(notifs.slice(0, 10));
  };

  const addLocalNotification = (type: Notification['type'], title: string, message: string) => {
    setNotifications(prev => [{
      id: `local-${Date.now()}`,
      type,
      title,
      message,
      read: false,
      created_at: new Date().toISOString(),
    }, ...prev].slice(0, 15));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'payment': return <CreditCard className="h-4 w-4 text-success-green" />;
      case 'ticket': return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning-orange" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hidden sm:flex hover:bg-secondary/60 h-9 w-9">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end" sideOffset={8}>
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Notificaciones</h4>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-7 px-2 text-muted-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Leer todo
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7 px-2 text-muted-foreground">
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((n) => (
                <div key={n.id} className={`p-3 flex gap-3 transition-colors ${n.read ? 'opacity-60' : 'bg-primary/5'}`}>
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{formatTime(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPanel;
