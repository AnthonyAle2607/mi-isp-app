import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Loader2 } from 'lucide-react';
import { ESTADOS_VENEZUELA, CEDULA_TYPES, CONNECTION_TYPES, type ServicePlan } from '@/lib/plans';

interface CreateUserDialogProps {
  onUserCreated: () => void;
}

const CreateUserDialog = ({ onUserCreated }: CreateUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    // Personal data
    email: '',
    fullName: '',
    phone: '',
    cedulaType: 'V',
    cedula: '',
    birthDate: '',
    gender: '',
    
    // Address
    estado: '',
    municipio: '',
    parroquia: '',
    sector: '',
    calle: '',
    casa: '',
    
    // Service
    connectionType: 'fibra' as 'fibra' | 'radio',
    planId: '',
    contractNumber: '',
    ipAddress: '',
    accountStatus: 'active',
    permanenceMonths: '12'
  });

  // Fetch plans when dialog opens
  useEffect(() => {
    if (open) {
      fetchPlans();
      generateContractNumber();
    }
  }, [open]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('service_plans')
      .select('*')
      .eq('is_active', true)
      .order('speed_mbps', { ascending: true });
    
    if (!error && data) {
      setPlans(data as ServicePlan[]);
    }
  };

  // Filter plans by connection type
  const filteredPlans = plans.filter(p => p.connection_type === formData.connectionType);

  // Generate next contract number
  const generateContractNumber = async () => {
    setGeneratingContract(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('contract_number')
        .not('contract_number', 'is', null)
        .like('contract_number', 'CT-%')
        .order('contract_number', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0 && data[0].contract_number) {
        const match = data[0].contract_number.match(/CT-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      const contractNumber = `CT-${nextNumber.toString().padStart(5, '0')}`;
      setFormData(prev => ({ ...prev, contractNumber }));
    } catch (error) {
      console.error('Error generating contract number:', error);
    } finally {
      setGeneratingContract(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Reset plan when connection type changes
    if (field === 'connectionType') {
      setFormData(prev => ({ 
        ...prev, 
        connectionType: value as 'fibra' | 'radio', 
        planId: '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Auto-fill password as cedula
  const getPassword = () => formData.cedula || '';

  const handleCreate = async () => {
    // Validation
    if (!formData.email || !formData.cedula || !formData.fullName) {
      toast({
        title: "Error",
        description: "Email, cédula y nombre completo son obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (formData.cedula.length < 6) {
      toast({
        title: "Error",
        description: "La cédula debe tener al menos 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    if (!formData.planId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un plan",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const selectedPlan = plans.find(p => p.id === formData.planId);
      const initialBalance = selectedPlan?.monthly_price || 0;

      // Build full address string
      const addressParts = [
        formData.estado,
        formData.municipio,
        formData.parroquia,
        formData.sector,
        formData.calle,
        formData.casa
      ].filter(Boolean);
      const fullAddress = addressParts.join(', ');

      // Create user with Supabase Auth (password = cedula)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.cedula, // Password is the cedula
        options: {
          data: {
            full_name: formData.fullName
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Update profile with all information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone || null,
          cedula: formData.cedula,
          cedula_type: formData.cedulaType,
          birth_date: formData.birthDate || null,
          gender: formData.gender || null,
          estado: formData.estado || null,
          municipio: formData.municipio || null,
          parroquia: formData.parroquia || null,
          sector: formData.sector || null,
          calle: formData.calle || null,
          casa: formData.casa || null,
          address: fullAddress || null,
          connection_type: formData.connectionType,
          plan_id: formData.planId,
          plan_type: selectedPlan?.name || 'basic',
          contract_number: formData.contractNumber,
          ip_address: formData.ipAddress || null,
          account_status: formData.accountStatus,
          permanence_months: parseInt(formData.permanenceMonths) || 12,
          pending_balance: initialBalance
        })
        .eq('user_id', authData.user.id);

      if (profileError) throw profileError;

      toast({
        title: "Usuario creado",
        description: `Contrato ${formData.contractNumber} creado. Contraseña: ${formData.cedula}`,
      });

      setOpen(false);
      resetForm();
      onUserCreated();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      fullName: '',
      phone: '',
      cedulaType: 'V',
      cedula: '',
      birthDate: '',
      gender: '',
      estado: '',
      municipio: '',
      parroquia: '',
      sector: '',
      calle: '',
      casa: '',
      connectionType: 'fibra',
      planId: '',
      contractNumber: '',
      ipAddress: '',
      accountStatus: 'active',
      permanenceMonths: '12'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Crear Contrato
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Contrato de Servicio</DialogTitle>
          <DialogDescription>
            Complete los datos del cliente. La contraseña será la cédula.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Datos Personales</TabsTrigger>
            <TabsTrigger value="address">Dirección</TabsTrigger>
            <TabsTrigger value="service">Servicio</TabsTrigger>
          </TabsList>
          
          {/* Personal Data Tab */}
          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  placeholder="NOMBRE APELLIDO"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cédula de Identidad *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.cedulaType}
                    onValueChange={(value) => handleInputChange('cedulaType', value)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CEDULA_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="12345678"
                    value={formData.cedula}
                    onChange={(e) => handleInputChange('cedula', e.target.value.replace(/\D/g, ''))}
                    className="flex-1 font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Esta será la contraseña del usuario</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono / Celular</Label>
                <Input
                  id="phone"
                  placeholder="+58 412-1234567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Género</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          {/* Address Tab */}
          <TabsContent value="address" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => handleInputChange('estado', value)}
                >
                  <SelectTrigger id="estado">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_VENEZUELA.map(estado => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="municipio">Municipio</Label>
                <Input
                  id="municipio"
                  placeholder="Ej: Libertador"
                  value={formData.municipio}
                  onChange={(e) => handleInputChange('municipio', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parroquia">Parroquia</Label>
                <Input
                  id="parroquia"
                  placeholder="Ej: San Juan"
                  value={formData.parroquia}
                  onChange={(e) => handleInputChange('parroquia', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sector">Sector / Urbanización</Label>
                <Input
                  id="sector"
                  placeholder="Ej: El Guarataro"
                  value={formData.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="calle">Calle / Avenida</Label>
                <Input
                  id="calle"
                  placeholder="Ej: Avenida San Martín"
                  value={formData.calle}
                  onChange={(e) => handleInputChange('calle', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="casa">Casa / Apto / Local</Label>
                <Input
                  id="casa"
                  placeholder="Ej: Casa 30-01"
                  value={formData.casa}
                  onChange={(e) => handleInputChange('casa', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Service Tab */}
          <TabsContent value="service" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractNumber">Número de Contrato</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="contractNumber"
                    value={formData.contractNumber}
                    disabled
                    className="bg-muted font-mono font-bold"
                  />
                  {generatingContract && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountStatus">Estado de Cuenta</Label>
                <Select
                  value={formData.accountStatus}
                  onValueChange={(value) => handleInputChange('accountStatus', value)}
                >
                  <SelectTrigger id="accountStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="suspended">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de Conexión</Label>
                <Select
                  value={formData.connectionType}
                  onValueChange={(value) => handleInputChange('connectionType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fibra">
                      <span className="flex items-center gap-2">
                        🔵 {CONNECTION_TYPES.fibra}
                      </span>
                    </SelectItem>
                    <SelectItem value="radio">
                      <span className="flex items-center gap-2">
                        📡 {CONNECTION_TYPES.radio}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Plan de Servicio *</Label>
                <Select
                  value={formData.planId}
                  onValueChange={(value) => handleInputChange('planId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.monthly_price.toFixed(2)}/mes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permanenceMonths">Permanencia (meses)</Label>
                <Select
                  value={formData.permanenceMonths}
                  onValueChange={(value) => handleInputChange('permanenceMonths', value)}
                >
                  <SelectTrigger id="permanenceMonths">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                    <SelectItem value="18">18 meses</SelectItem>
                    <SelectItem value="24">24 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ipAddress">Dirección IP (opcional)</Label>
                <Input
                  id="ipAddress"
                  placeholder="192.168.1.100"
                  value={formData.ipAddress}
                  onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Se puede asignar después</p>
              </div>
            </div>
            
            {/* Summary */}
            {formData.planId && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-foreground mb-2">Resumen del Contrato</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="ml-2 text-foreground">{formData.cedulaType}-{formData.cedula}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="ml-2 text-foreground">
                      {plans.find(p => p.id === formData.planId)?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Saldo inicial:</span>
                    <span className="ml-2 text-foreground font-bold">
                      ${plans.find(p => p.id === formData.planId)?.monthly_price.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contraseña:</span>
                    <span className="ml-2 text-foreground font-mono">{formData.cedula || '---'}</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Contrato'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
