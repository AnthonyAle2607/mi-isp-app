import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, CheckCircle, AlertTriangle, CreditCard, MessageSquare, Trash2, WifiOff, Info, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  type: 'payment' | 'ticket' | 'system' | 'warning' | 'outage' | 'maintenance' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const NotificationItem = ({ notification: n, getIcon, formatTime }: { notification: Notification; getIcon: (type: Notification['type']) => React.ReactNode; formatTime: (d: string) => string }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = n.message.length > 80;

  return (
    <div
      className={`p-3 flex gap-3 transition-colors cursor-pointer ${n.read ? 'opacity-60' : 'bg-primary/5'}`}
      onClick={() => isLong && setExpanded(!expanded)}
    >
      <div className="mt-0.5">{getIcon(n.type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{n.title}</p>
        <p className={`text-xs text-muted-foreground ${expanded ? '' : 'line-clamp-2'}`}>{n.message}</p>
        <div className="flex items-center gap-1 mt-1">
          <p className="text-xs text-muted-foreground/60">{formatTime(n.created_at)}</p>
          {isLong && (
            expanded
              ? <ChevronUp className="h-3 w-3 text-muted-foreground/60" />
              : <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationsPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

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

    // Listen for new admin notifications in real-time
    const adminNotifChannel = supabase
      .channel('admin-notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notifications',
      }, () => {
        // Refetch to check if notification targets this user
        fetchAdminNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(paymentChannel);
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(adminNotifChannel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

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

    // Fetch admin notifications targeted to this user
    const adminNotifs = await fetchAdminNotifications();
    notifs.push(...adminNotifs);

    notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifications(prev => {
      // Merge: keep local-only notifs and replace fetched ones
      const localOnly = prev.filter(n => n.id.startsWith('local-'));
      const merged = [...localOnly, ...notifs];
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return merged.slice(0, 20);
    });
  };

  const fetchAdminNotifications = async (): Promise<Notification[]> => {
    if (!user) return [];

    try {
      // Get user profile to determine targeting
      const { data: profile } = await supabase
        .from('profiles')
        .select('node, olt_equipment, sector, nap_box, account_status')
        .eq('user_id', user.id)
        .single();

      // Get read notification IDs
      const { data: reads } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

      const readIds = new Set((reads || []).map(r => r.notification_id));

      // Get recent admin notifications
      const { data: adminNotifs } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!adminNotifs) return [];

      // Filter notifications that target this user
      return adminNotifs
        .filter(n => {
          if (n.target_type === 'all') return true;
          if (!profile) return false;
          const fieldMap: Record<string, string | null> = {
            node: profile.node,
            olt: profile.olt_equipment,
            sector: profile.sector,
            nap_box: profile.nap_box,
            status: profile.account_status,
          };
          return fieldMap[n.target_type] === n.target_value;
        })
        .map(n => ({
          id: `admin-${n.id}`,
          type: n.notification_type as Notification['type'],
          title: n.title,
          message: n.message,
          read: readIds.has(n.id),
          created_at: n.created_at,
        }));
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      return [];
    }
  };

  const addLocalNotification = (type: Notification['type'], title: string, message: string) => {
    setNotifications(prev => [{
      id: `local-${Date.now()}`,
      type,
      title,
      message,
      read: false,
      created_at: new Date().toISOString(),
    }, ...prev].slice(0, 20));
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // Mark admin notifications as read in DB
    if (!user) return;
    const adminNotifIds = notifications
      .filter(n => n.id.startsWith('admin-') && !n.read)
      .map(n => n.id.replace('admin-', ''));

    if (adminNotifIds.length > 0) {
      const inserts = adminNotifIds.map(id => ({ notification_id: id, user_id: user.id }));
      await supabase.from('notification_reads').upsert(inserts, { onConflict: 'notification_id,user_id' });
    }
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
      case 'outage': return <WifiOff className="h-4 w-4 text-destructive" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4 text-warning-orange" />;
      case 'promotion': return <Megaphone className="h-4 w-4 text-success-green" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
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
                <NotificationItem key={n.id} notification={n} getIcon={getIcon} formatTime={formatTime} />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPanel;
