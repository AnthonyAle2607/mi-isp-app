import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AccountInfo {
  account_status: string;
  last_payment_date: string | null;
  next_billing_date: string | null;
}

const AccountStatus = () => {
  const { user } = useAuth();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAccountInfo();
    }
  }, [user]);

  const fetchAccountInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('account_status, last_payment_date, next_billing_date')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setAccountInfo(data);
    } catch (error) {
      console.error('Error fetching account info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle2,
          label: 'Activo',
          variant: 'default' as const,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10'
        };
      case 'suspended':
        return {
          icon: AlertCircle,
          label: 'Suspendido',
          variant: 'destructive' as const,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10'
        };
      case 'inactive':
        return {
          icon: Clock,
          label: 'Inactivo',
          variant: 'secondary' as const,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10'
        };
      default:
        return {
          icon: Clock,
          label: status,
          variant: 'outline' as const,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted'
        };
    }
  };

  const statusConfig = getStatusConfig(accountInfo?.account_status || 'inactive');
  const StatusIcon = statusConfig.icon;

  const daysUntilCutoff = accountInfo?.next_billing_date 
    ? Math.ceil((new Date(accountInfo.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Estado de Cuenta
        </CardTitle>
        <CardDescription>
          Información sobre tu servicio y próxima fecha de pago
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`rounded-lg p-4 ${statusConfig.bgColor} border border-border/50`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
              <div>
                <p className="text-sm text-muted-foreground">Estado del Servicio</p>
                <p className="text-lg font-semibold text-foreground">{statusConfig.label}</p>
              </div>
            </div>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </div>

        {accountInfo?.last_payment_date && (
          <div className="bg-secondary/20 rounded-lg p-4 border border-border/50">
            <p className="text-sm text-muted-foreground mb-1">Último Pago</p>
            <p className="font-semibold text-foreground">
              {format(new Date(accountInfo.last_payment_date), 'PPP', { locale: es })}
            </p>
          </div>
        )}

        {accountInfo?.next_billing_date && (
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Próxima Fecha de Corte</p>
                <p className="font-semibold text-foreground">
                  {format(new Date(accountInfo.next_billing_date), 'PPP', { locale: es })}
                </p>
              </div>
              {daysUntilCutoff !== null && daysUntilCutoff > 0 && (
                <Badge variant="outline" className="text-xs">
                  {daysUntilCutoff} {daysUntilCutoff === 1 ? 'día' : 'días'}
                </Badge>
              )}
            </div>
          </div>
        )}

        {accountInfo?.account_status === 'suspended' && (
          <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive mb-1">Servicio Suspendido</p>
                <p className="text-sm text-muted-foreground">
                  Tu servicio ha sido suspendido por falta de pago. 
                  Por favor, realiza tu pago para reactivar el servicio automáticamente.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
          <p className="font-medium mb-1">ℹ️ Información importante:</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>Las fechas de corte son cada día 5 del mes</li>
            <li>Asegúrate de pagar antes de la fecha de corte</li>
            <li>Al verificarse tu pago, tu servicio se reactivará automáticamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountStatus;
