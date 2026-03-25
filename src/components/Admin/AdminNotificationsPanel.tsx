import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Trash2, AlertTriangle, Info, Wifi, WifiOff, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  target_type: string;
  target_value: string | null;
  created_at: string;
}

const NOTIFICATION_TYPES = [
  { value: 'outage', label: 'Falla de Servicio', icon: WifiOff, color: 'text-destructive' },
  { value: 'maintenance', label: 'Mantenimiento', icon: AlertTriangle, color: 'text-warning-orange' },
  { value: 'general', label: 'Información General', icon: Info, color: 'text-primary' },
  { value: 'promotion', label: 'Promoción', icon: Megaphone, color: 'text-success-green' },
];

const TARGET_TYPES = [
  { value: 'all', label: 'Todos los usuarios' },
  { value: 'node', label: 'Por Nodo' },
  { value: 'olt', label: 'Por OLT' },
  { value: 'sector', label: 'Por Sector/Zona' },
  { value: 'nap_box', label: 'Por NAP/PON' },
  { value: 'status', label: 'Por Estado de Cuenta' },
];

const AdminNotificationsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('outage');
  const [targetType, setTargetType] = useState('all');
  const [targetValue, setTargetValue] = useState('');
  const [targetOptions, setTargetOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (targetType !== 'all') {
      fetchTargetOptions();
    } else {
      setTargetOptions([]);
      setTargetValue('');
    }
  }, [targetType]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTargetOptions = async () => {
    const fieldMap: Record<string, string> = {
      node: 'node',
      olt: 'olt_equipment',
      sector: 'sector',
      nap_box: 'nap_box',
      status: 'account_status',
    };

    const field = fieldMap[targetType];
    if (!field) return;

    try {
      const query = supabase.from('profiles').select(field as any);
      const { data, error } = await (query as any).not(field, 'is', null);

      if (error) throw error;

      const values = (data || []).map((d: any) => String(d[field])).filter(Boolean);
      const unique = Array.from(new Set(values)) as string[];
      setTargetOptions(unique.sort());
      setTargetValue('');
    } catch (error) {
      console.error('Error fetching target options:', error);
    }
  };

  const getAffectedCount = async (): Promise<number> => {
    if (targetType === 'all') {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      return count || 0;
    }

    const fieldMap: Record<string, string> = {
      node: 'node',
      olt: 'olt_equipment',
      sector: 'sector',
      nap_box: 'nap_box',
      status: 'account_status',
    };

    const field = fieldMap[targetType];
    if (!field || !targetValue) return 0;

    const query = supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count } = await (query as any).eq(field, targetValue);

    return count || 0;
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Error', description: 'Completa el título y mensaje', variant: 'destructive' });
      return;
    }
    if (targetType !== 'all' && !targetValue) {
      toast({ title: 'Error', description: 'Selecciona un valor de destino', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const affected = await getAffectedCount();

      const { error } = await supabase.from('admin_notifications').insert({
        title: title.trim(),
        message: message.trim(),
        notification_type: notificationType,
        target_type: targetType,
        target_value: targetType === 'all' ? null : targetValue,
        created_by: user!.id,
      });

      if (error) throw error;

      toast({
        title: '✅ Notificación enviada',
        description: `Se notificará a ${affected} usuario(s)`,
      });

      setTitle('');
      setMessage('');
      setNotificationType('outage');
      setTargetType('all');
      setTargetValue('');
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({ title: 'Error', description: 'No se pudo enviar la notificación', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('admin_notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({ title: 'Eliminada', description: 'Notificación eliminada' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const getTypeInfo = (type: string) => NOTIFICATION_TYPES.find(t => t.value === type) || NOTIFICATION_TYPES[2];
  const getTargetLabel = (type: string, value: string | null) => {
    if (type === 'all') return 'Todos';
    const t = TARGET_TYPES.find(t => t.value === type);
    return `${t?.label || type}: ${value}`;
  };

  const quickTemplates = [
    { title: 'Falla en zona', message: 'Estimado cliente, le informamos que estamos presentando una intermitencia en el servicio de internet en su zona. Nuestro equipo técnico ya se encuentra trabajando para restablecer el servicio lo antes posible. Disculpe las molestias.', type: 'outage' },
    { title: 'Mantenimiento programado', message: 'Estimado cliente, le notificamos que realizaremos un mantenimiento programado en su zona para mejorar la calidad del servicio. Durante este periodo podría experimentar interrupciones temporales. Agradecemos su comprensión.', type: 'maintenance' },
    { title: 'Servicio restablecido', message: 'Estimado cliente, le informamos que el servicio de internet ha sido restablecido en su zona. Si continúa presentando inconvenientes, por favor reinicie su router y ONU. De persistir el problema, contáctenos por WhatsApp.', type: 'general' },
  ];

  return (
    <div className="space-y-6">
      {/* Send Notification Form */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Enviar Notificación</h3>
            <p className="text-sm text-muted-foreground">Notifica a tus clientes sobre fallas, mantenimientos o avisos</p>
          </div>
        </div>

        {/* Quick Templates */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Plantillas rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {quickTemplates.map((tmpl, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setTitle(tmpl.title);
                  setMessage(tmpl.message);
                  setNotificationType(tmpl.type);
                }}
              >
                {tmpl.title}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo de notificación</label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <t.icon className={`h-4 w-4 ${t.color}`} />
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Destinatarios</label>
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {targetType !== 'all' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Seleccionar {TARGET_TYPES.find(t => t.value === targetType)?.label}
            </label>
            {targetOptions.length > 0 ? (
              <Select value={targetValue} onValueChange={setTargetValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {targetOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No hay opciones disponibles para este filtro</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Título</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Falla en zona norte"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Mensaje</label>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe la situación para los clientes..."
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
        </div>

        <Button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()} className="w-full shine">
          <Send className="h-4 w-4 mr-2" />
          {sending ? 'Enviando...' : 'Enviar Notificación'}
        </Button>
      </div>

      {/* History */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Historial de Notificaciones</h3>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No se han enviado notificaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => {
              const typeInfo = getTypeInfo(n.notification_type);
              const TypeIcon = typeInfo.icon;
              return (
                <div key={n.id} className="p-4 rounded-xl bg-secondary/20 border border-border/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                      <span className="font-semibold text-sm text-foreground">{n.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {getTargetLabel(n.target_type, n.target_value)}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(n.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground/60">
                    {format(new Date(n.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPanel;
