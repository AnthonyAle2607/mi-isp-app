import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Loader2, Cable, Server, Wifi, Network } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  contract_number?: string;
  connection_type?: string;
  link_type?: string;
  node?: string;
  technical_equipment?: string;
  nap_box?: string;
  nap_port?: string;
  olt_equipment?: string;
  onu_serial?: string;
  ctif_notes?: string;
}

interface EditTechnicalDataDialogProps {
  profile: Profile;
  onUpdate: () => void;
}

const LINK_TYPES = ['Fibra Directa', 'Fibra NAP', 'Radio PtP', 'Radio PtMP', 'Híbrido'];

const EditTechnicalDataDialog = ({ profile, onUpdate }: EditTechnicalDataDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    link_type: profile.link_type || '',
    node: profile.node || '',
    technical_equipment: profile.technical_equipment || '',
    nap_box: profile.nap_box || '',
    nap_port: profile.nap_port || '',
    olt_equipment: profile.olt_equipment || '',
    onu_serial: profile.onu_serial || '',
    ctif_notes: profile.ctif_notes || ''
  });

  useEffect(() => {
    setFormData({
      link_type: profile.link_type || '',
      node: profile.node || '',
      technical_equipment: profile.technical_equipment || '',
      nap_box: profile.nap_box || '',
      nap_port: profile.nap_port || '',
      olt_equipment: profile.olt_equipment || '',
      onu_serial: profile.onu_serial || '',
      ctif_notes: profile.ctif_notes || ''
    });
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          link_type: formData.link_type || null,
          node: formData.node || null,
          technical_equipment: formData.technical_equipment || null,
          nap_box: formData.nap_box || null,
          nap_port: formData.nap_port || null,
          olt_equipment: formData.olt_equipment || null,
          onu_serial: formData.onu_serial || null,
          ctif_notes: formData.ctif_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Datos técnicos actualizados correctamente",
      });
      
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating technical data:', error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos técnicos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFiber = profile.connection_type === 'fibra';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Settings2 className="h-4 w-4" />
          CTIF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Datos Técnicos de Infraestructura (CTIF)
          </DialogTitle>
          <DialogDescription>
            Contrato: {profile.contract_number || 'N/A'} - {profile.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Link Type */}
          <div className="space-y-2">
            <Label htmlFor="link_type" className="flex items-center gap-2">
              <Cable className="h-4 w-4" />
              Tipo de Enlace
            </Label>
            <Select
              value={formData.link_type}
              onValueChange={(value) => handleInputChange('link_type', value)}
            >
              <SelectTrigger id="link_type">
                <SelectValue placeholder="Seleccionar tipo de enlace" />
              </SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Node */}
          <div className="space-y-2">
            <Label htmlFor="node" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Nodo de Red
            </Label>
            <Input
              id="node"
              placeholder="Ej: NODO-CENTRAL-01"
              value={formData.node}
              onChange={(e) => handleInputChange('node', e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>

          {/* Technical Equipment */}
          <div className="space-y-2">
            <Label htmlFor="technical_equipment">Equipo Técnico Instalado</Label>
            <Input
              id="technical_equipment"
              placeholder="Ej: Router TP-Link Archer C6"
              value={formData.technical_equipment}
              onChange={(e) => handleInputChange('technical_equipment', e.target.value)}
            />
          </div>

          {/* Fiber-specific fields */}
          {isFiber && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nap_box">Caja NAP</Label>
                  <Input
                    id="nap_box"
                    placeholder="Ej: NAP-BLQ-15"
                    value={formData.nap_box}
                    onChange={(e) => handleInputChange('nap_box', e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nap_port">Puerto NAP</Label>
                  <Input
                    id="nap_port"
                    placeholder="Ej: P-03"
                    value={formData.nap_port}
                    onChange={(e) => handleInputChange('nap_port', e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="olt_equipment" className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Equipo OLT
                </Label>
                <Input
                  id="olt_equipment"
                  placeholder="Ej: OLT-HUAWEI-01"
                  value={formData.olt_equipment}
                  onChange={(e) => handleInputChange('olt_equipment', e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onu_serial">Serial ONU</Label>
                <Input
                  id="onu_serial"
                  placeholder="Ej: HWTC12345678"
                  value={formData.onu_serial}
                  onChange={(e) => handleInputChange('onu_serial', e.target.value.toUpperCase())}
                  className="uppercase font-mono"
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="ctif_notes">Notas Adicionales</Label>
            <Textarea
              id="ctif_notes"
              placeholder="Observaciones técnicas, detalles de instalación, etc."
              value={formData.ctif_notes}
              onChange={(e) => handleInputChange('ctif_notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTechnicalDataDialog;
