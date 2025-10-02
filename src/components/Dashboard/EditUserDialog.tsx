import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Loader2 } from 'lucide-react';

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
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    address: profile.address || '',
    ip_address: profile.ip_address || '',
    contract_number: profile.contract_number || '',
    plan_type: profile.plan_type || 'basic',
    account_status: profile.account_status || 'active'
  });

  useEffect(() => {
    setFormData({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      address: profile.address || '',
      ip_address: profile.ip_address || '',
      contract_number: profile.contract_number || '',
      plan_type: profile.plan_type || 'basic',
      account_status: profile.account_status || 'active'
    });
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente",
      });
      
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este perfil? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      // First delete from user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', profile.user_id);

      if (roleError) throw roleError;

      // Then delete from profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (profileError) throw profileError;

      toast({
        title: "Éxito",
        description: "Perfil eliminado correctamente",
      });
      
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el perfil",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Usuario
          </DialogTitle>
          <DialogDescription>
            Modifica la información del usuario seleccionado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
              {userRole === 'admin' ? 'Administrador' : 'Usuario'}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_full_name">Nombre Completo</Label>
            <Input
              id="edit_full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Nombre completo"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_phone">Teléfono</Label>
            <Input
              id="edit_phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Número de teléfono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_address">Dirección</Label>
            <Textarea
              id="edit_address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Dirección"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_ip_address">Dirección IP</Label>
            <Input
              id="edit_ip_address"
              value={formData.ip_address}
              onChange={(e) => handleInputChange('ip_address', e.target.value)}
              placeholder="192.168.1.100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_contract_number">Número de Contrato</Label>
            <Input
              id="edit_contract_number"
              value={formData.contract_number}
              onChange={(e) => handleInputChange('contract_number', e.target.value)}
              placeholder="CTR-2024-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_plan_type">Plan</Label>
            <Select
              value={formData.plan_type}
              onValueChange={(value) => handleInputChange('plan_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Básico - 50 Mbps</SelectItem>
                <SelectItem value="premium">Premium - 100 Mbps</SelectItem>
                <SelectItem value="ultra">Ultra - 200 Mbps</SelectItem>
                <SelectItem value="enterprise">Empresarial - 500 Mbps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_account_status">Estado de Cuenta</Label>
            <Select
              value={formData.account_status}
              onValueChange={(value) => handleInputChange('account_status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between gap-2 pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteLoading || userRole === 'admin'}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
            
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;