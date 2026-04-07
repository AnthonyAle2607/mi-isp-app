import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { ESTADOS_VENEZUELA, CEDULA_TYPES, type ServicePlan } from '@/lib/plans';

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
  cedula?: string;
  cedula_type?: string;
  connection_type?: string;
  plan_id?: string;
  estado?: string;
  municipio?: string;
  parroquia?: string;
  sector?: string;
  calle?: string;
  casa?: string;
  pending_balance?: number;
  birth_date?: string;
  gender?: string;
  permanence_months?: number;
  installation_date?: string;
}

interface EditUserDialogProps {
  profile: Profile;
  userRole: string;
  onUpdate: () => void;
}

const EditUserDialog = ({ profile, userRole, onUpdate }: EditUserDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    cedula: '',
    cedula_type: 'V',
    birth_date: '',
    gender: '',
    estado: '',
    municipio: '',
    parroquia: '',
    sector: '',
    calle: '',
    casa: '',
    ip_address: '',
    contract_number: '',
    connection_type: 'fibra',
    plan_id: '',
    plan_type: '',
    account_status: 'active',
    pending_balance: '0',
    permanence_months: '12',
    installation_date: '',
  });

  useEffect(() => {
    if (open) {
      fetchPlans();
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        cedula: profile.cedula || '',
        cedula_type: profile.cedula_type || 'V',
        birth_date: profile.birth_date || '',
        gender: profile.gender || '',
        estado: profile.estado || '',
        municipio: profile.municipio || '',
        parroquia: profile.parroquia || '',
        sector: profile.sector || '',
        calle: profile.calle || '',
        casa: profile.casa || '',
        ip_address: profile.ip_address || '',
        contract_number: profile.contract_number || '',
        connection_type: profile.connection_type || 'fibra',
        plan_id: profile.plan_id || '',
        plan_type: profile.plan_type || '',
        account_status: profile.account_status || 'active',
        pending_balance: String(profile.pending_balance || 0),
        permanence_months: String(profile.permanence_months || 12),
        installation_date: profile.installation_date || '',
      });
    }
  }, [open, profile]);

  const fetchPlans = async () => {
    const { data } = await supabase.from('service_plans').select('*').eq('is_active', true).order('speed_mbps');
    if (data) setPlans(data as ServicePlan[]);
  };

  const filteredPlans = plans.filter(p => p.connection_type === formData.connection_type);

  const handleChange = (field: string, value: string) => {
    if (field === 'connection_type') {
      setFormData(prev => ({ ...prev, connection_type: value, plan_id: '' }));
    } else if (field === 'plan_id') {
      const plan = plans.find(p => p.id === value);
      setFormData(prev => ({ ...prev, plan_id: value, plan_type: plan?.name || prev.plan_type }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const addressParts = [formData.estado, formData.municipio, formData.parroquia, formData.sector, formData.calle, formData.casa].filter(Boolean);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          cedula: formData.cedula || null,
          cedula_type: formData.cedula_type,
          birth_date: formData.birth_date || null,
          gender: formData.gender || null,
          estado: formData.estado || null,
          municipio: formData.municipio || null,
          parroquia: formData.parroquia || null,
          sector: formData.sector || null,
          calle: formData.calle || null,
          casa: formData.casa || null,
          address: addressParts.join(', ') || null,
          ip_address: formData.ip_address || null,
          contract_number: formData.contract_number || null,
          connection_type: formData.connection_type,
          plan_id: formData.plan_id || null,
          plan_type: formData.plan_type || null,
          account_status: formData.account_status,
          pending_balance: parseFloat(formData.pending_balance) || 0,
          permanence_months: parseInt(formData.permanence_months) || 12,
          installation_date: formData.installation_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast({ title: 'Perfil actualizado correctamente' });
      setOpen(false);
      onUpdate();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este perfil? Esta acción no se puede deshacer.')) return;
    setDeleteLoading(true);
    try {
      await supabase.from('user_roles').delete().eq('user_id', profile.user_id);
      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
      if (error) throw error;
      toast({ title: 'Perfil eliminado' });
      setOpen(false);
      onUpdate();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally { setDeleteLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" /> Editar Cliente
          </DialogTitle>
          <DialogDescription>
            {profile.contract_number || '—'} · {profile.full_name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="address">Dirección</TabsTrigger>
            <TabsTrigger value="service">Servicio</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nombre Completo</Label>
                <Input value={formData.full_name} onChange={e => handleChange('full_name', e.target.value.toUpperCase())} className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Cédula</Label>
                <div className="flex gap-2">
                  <Select value={formData.cedula_type} onValueChange={v => handleChange('cedula_type', v)}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>{CEDULA_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={formData.cedula} onChange={e => handleChange('cedula', e.target.value.replace(/\D/g, ''))} className="flex-1 font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha Nacimiento</Label>
                <Input type="date" value={formData.birth_date} onChange={e => handleChange('birth_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Género</Label>
                <Select value={formData.gender} onValueChange={v => handleChange('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="address" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={v => handleChange('estado', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{ESTADOS_VENEZUELA.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Municipio</Label><Input value={formData.municipio} onChange={e => handleChange('municipio', e.target.value)} /></div>
              <div className="space-y-2"><Label>Parroquia</Label><Input value={formData.parroquia} onChange={e => handleChange('parroquia', e.target.value)} /></div>
              <div className="space-y-2"><Label>Sector</Label><Input value={formData.sector} onChange={e => handleChange('sector', e.target.value)} /></div>
              <div className="space-y-2"><Label>Calle</Label><Input value={formData.calle} onChange={e => handleChange('calle', e.target.value)} /></div>
              <div className="space-y-2"><Label>Casa/Apto</Label><Input value={formData.casa} onChange={e => handleChange('casa', e.target.value)} /></div>
            </div>
          </TabsContent>

          <TabsContent value="service" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contrato</Label>
                <Input value={formData.contract_number} onChange={e => handleChange('contract_number', e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Estado de Cuenta</Label>
                <Select value={formData.account_status} onValueChange={v => handleChange('account_status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Conexión</Label>
                <Select value={formData.connection_type} onValueChange={v => handleChange('connection_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fibra">🔵 Fibra Óptica</SelectItem>
                    <SelectItem value="radio">📡 Radiofrecuencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={formData.plan_id} onValueChange={v => handleChange('plan_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
                  <SelectContent>
                    {filteredPlans.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} - {p.speed_mbps}Mbps - ${p.monthly_price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>IP Asignada</Label>
                <Input value={formData.ip_address} onChange={e => handleChange('ip_address', e.target.value)} className="font-mono" placeholder="10.0.0.x" />
              </div>
              <div className="space-y-2">
                <Label>Saldo Pendiente ($)</Label>
                <Input type="number" step="0.01" value={formData.pending_balance} onChange={e => handleChange('pending_balance', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Permanencia (meses)</Label>
                <Input type="number" value={formData.permanence_months} onChange={e => handleChange('permanence_months', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha Instalación</Label>
                <Input type="date" value={formData.installation_date} onChange={e => handleChange('installation_date', e.target.value)} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteLoading || userRole === 'admin'}>
            {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
            Eliminar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
