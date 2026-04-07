import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Loader2, Wifi, Radio } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  connection_type: string;
  speed_mbps: number;
  monthly_price: number;
  is_active: boolean;
  created_at: string;
}

const emptyPlan = { name: '', connection_type: 'fibra', speed_mbps: '', monthly_price: '', is_active: true };

const ServicePlansPanel = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<any>(emptyPlan);
  const { toast } = useToast();

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_plans')
      .select('*')
      .order('connection_type')
      .order('speed_mbps', { ascending: true });
    if (!error) setPlans(data || []);
    setLoading(false);
  };

  const openCreate = () => { setEditingPlan(null); setForm(emptyPlan); setDialogOpen(true); };
  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({ name: plan.name, connection_type: plan.connection_type, speed_mbps: String(plan.speed_mbps), monthly_price: String(plan.monthly_price), is_active: plan.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.speed_mbps || !form.monthly_price) {
      toast({ title: 'Error', description: 'Todos los campos son requeridos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        connection_type: form.connection_type,
        speed_mbps: parseInt(form.speed_mbps),
        monthly_price: parseFloat(form.monthly_price),
        is_active: form.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase.from('service_plans').update(payload).eq('id', editingPlan.id);
        if (error) throw error;
        toast({ title: 'Plan actualizado' });
      } else {
        const { error } = await supabase.from('service_plans').insert(payload);
        if (error) throw error;
        toast({ title: 'Plan creado' });
      }
      setDialogOpen(false);
      fetchPlans();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const toggleActive = async (plan: Plan) => {
    const { error } = await supabase.from('service_plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
    if (!error) fetchPlans();
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Planes de Internet</h3>
            <p className="text-sm text-muted-foreground">{plans.length} planes configurados</p>
          </div>
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Nuevo Plan</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Velocidad</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
            ) : plans.map(plan => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1">
                    {plan.connection_type === 'fibra' ? <><Wifi className="h-3 w-3" /> Fibra</> : <><Radio className="h-3 w-3" /> Radio</>}
                  </Badge>
                </TableCell>
                <TableCell>{plan.speed_mbps} Mbps</TableCell>
                <TableCell className="font-semibold">${plan.monthly_price.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={plan.is_active ? 'bg-success-green/10 text-success-green' : 'bg-muted text-muted-foreground'}>
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Switch checked={plan.is_active} onCheckedChange={() => toggleActive(plan)} />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
            <DialogDescription>Configure los detalles del plan de internet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Plan</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Plan Hogar 100 Mbps" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Conexión</Label>
              <Select value={form.connection_type} onValueChange={v => setForm({ ...form, connection_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fibra">Fibra Óptica</SelectItem>
                  <SelectItem value="radio">Radiofrecuencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Velocidad (Mbps)</Label>
                <Input type="number" value={form.speed_mbps} onChange={e => setForm({ ...form, speed_mbps: e.target.value })} placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label>Precio Mensual ($)</Label>
                <Input type="number" step="0.01" value={form.monthly_price} onChange={e => setForm({ ...form, monthly_price: e.target.value })} placeholder="25.00" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Plan activo</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicePlansPanel;
