import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Wifi, Server, Calendar, DollarSign, Phone, Mail, FileText, Cable, Network } from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  ip_address?: string;
  contract_number?: string;
  plan_type: string;
  account_status: string;
  created_at: string;
  cedula?: string;
  cedula_type?: string;
  connection_type?: string;
  node?: string;
  olt_equipment?: string;
  sector?: string;
  pending_balance?: number;
  next_billing_date?: string;
  last_payment_date?: string;
  installation_date?: string;
  estado?: string;
  municipio?: string;
  parroquia?: string;
  calle?: string;
  casa?: string;
  nap_box?: string;
  nap_port?: string;
  onu_serial?: string;
  link_type?: string;
  technical_equipment?: string;
  ctif_notes?: string;
  birth_date?: string;
  gender?: string;
  permanence_months?: number;
}

interface ClientDetailSheetProps {
  profile: Profile;
  userRole: string;
  open: boolean;
  onClose: () => void;
}

const Field = ({ label, value, icon: Icon, mono }: { label: string; value?: string | number | null; icon?: any; mono?: boolean }) => (
  <div className="flex items-start gap-2 py-1.5">
    {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
    <div className="grid grid-cols-2 gap-x-4">{children}</div>
  </div>
);

const ClientDetailSheet = ({ profile, userRole, open, onClose }: ClientDetailSheetProps) => {
  const statusMap: Record<string, { label: string; cls: string }> = {
    active: { label: 'Activo', cls: 'bg-success-green/10 text-success-green border-success-green/20' },
    suspended: { label: 'Suspendido', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
    inactive: { label: 'Inactivo', cls: 'bg-muted text-muted-foreground border-border' },
  };
  const st = statusMap[profile.account_status] || statusMap.inactive;

  const fmtDate = (d?: string | null) => d ? format(new Date(d), 'dd/MM/yyyy') : '—';

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="block">{profile.full_name || 'Sin nombre'}</span>
              <span className="text-xs text-muted-foreground font-normal">{profile.contract_number || '—'}</span>
            </div>
          </SheetTitle>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="secondary" className={st.cls}>{st.label}</Badge>
            {userRole === 'admin' && <Badge variant="default">Admin</Badge>}
            {profile.connection_type && (
              <Badge variant="outline">{profile.connection_type === 'fibra' ? '🔵 Fibra' : '📡 Radio'}</Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          <Section title="Datos Personales">
            <Field label="Cédula" value={`${profile.cedula_type || 'V'}-${profile.cedula || '—'}`} icon={FileText} mono />
            <Field label="Teléfono" value={profile.phone} icon={Phone} />
            <Field label="Fecha Nacimiento" value={fmtDate(profile.birth_date)} icon={Calendar} />
            <Field label="Género" value={profile.gender} icon={User} />
          </Section>

          <Separator />

          <Section title="Dirección">
            <Field label="Estado" value={profile.estado} icon={MapPin} />
            <Field label="Municipio" value={profile.municipio} />
            <Field label="Parroquia" value={profile.parroquia} />
            <Field label="Sector" value={profile.sector} />
            <Field label="Calle" value={profile.calle} />
            <Field label="Casa" value={profile.casa} />
          </Section>

          <Separator />

          <Section title="Servicio">
            <Field label="Plan" value={profile.plan_type} icon={Wifi} />
            <Field label="IP Asignada" value={profile.ip_address} icon={Network} mono />
            <Field label="Fecha Instalación" value={fmtDate(profile.installation_date)} icon={Calendar} />
            <Field label="Permanencia" value={profile.permanence_months ? `${profile.permanence_months} meses` : undefined} />
          </Section>

          <Separator />

          <Section title="Facturación">
            <Field label="Saldo Pendiente" value={`$${(profile.pending_balance || 0).toFixed(2)}`} icon={DollarSign} />
            <Field label="Último Pago" value={fmtDate(profile.last_payment_date)} icon={Calendar} />
            <Field label="Próximo Corte" value={fmtDate(profile.next_billing_date)} icon={Calendar} />
          </Section>

          <Separator />

          <Section title="Datos Técnicos (CTIF)">
            <Field label="Tipo Enlace" value={profile.link_type} icon={Cable} />
            <Field label="Nodo" value={profile.node} icon={Server} />
            <Field label="Equipo Técnico" value={profile.technical_equipment} />
            <Field label="Caja NAP" value={profile.nap_box} />
            <Field label="Puerto NAP" value={profile.nap_port} />
            <Field label="OLT" value={profile.olt_equipment} />
            <Field label="Serial ONU" value={profile.onu_serial} mono />
          </Section>

          {profile.ctif_notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Observaciones</h4>
                <p className="text-sm text-foreground bg-secondary/20 rounded-lg p-3">{profile.ctif_notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ClientDetailSheet;
