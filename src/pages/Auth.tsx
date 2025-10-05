import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Wifi, Shield, Zap, ArrowLeft, Phone, Mail } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.string().email('Email inválido').min(1, 'El email es requerido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');
const phoneSchema = z.string().regex(/^(\+58|0)(4[0-2][0-9]|1[0-9]{2})[0-9]{7}$/, 'Número de teléfono venezolano inválido (ejemplo: +584121234567 o 04121234567)');
const fullNameSchema = z.string().min(2, 'El nombre debe tener al menos 2 caracteres');

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email');
  const { signIn, signUp, signUpWithPhone, verifyOtp, resetPassword, updatePassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
    
    if (searchParams.get('reset') === 'true') {
      setShowNewPasswordForm(true);
    }
  }, [user, navigate, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    if (!error) {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      fullNameSchema.parse(fullName);
      if (signupMethod === 'email') {
        emailSchema.parse(email);
      } else {
        phoneSchema.parse(phone);
      }
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    const { error } = signupMethod === 'email'
      ? await signUp(email, password, fullName)
      : await signUpWithPhone(phone, password, fullName);
    
    if (!error && signupMethod === 'phone') {
      setShowOtpForm(true);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await verifyOtp(phone, otp);
    if (!error) {
      setShowOtpForm(false);
      navigate('/');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resetEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    const { error } = await resetPassword(resetEmail);
    setLoading(false);
    if (!error) {
      setShowResetForm(false);
      setResetEmail('');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    if (!error) {
      setShowNewPasswordForm(false);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center items-center gap-2 mb-3 sm:mb-4">
            <Wifi className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">SilverData</h1>
          </div>
          <p className="text-sm sm:text-base text-white/80">Plataforma de Autogestión ISP</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl text-white">
              {showResetForm ? "Recuperar Contraseña" : showNewPasswordForm ? "Nueva Contraseña" : showOtpForm ? "Verificar Código" : "Acceso al Portal"}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-white/70">
              {showResetForm ? "Ingresa tu email para restablecer tu contraseña" : showNewPasswordForm ? "Crea tu nueva contraseña" : showOtpForm ? "Ingresa el código enviado a tu teléfono" : "Gestiona tu servicio de internet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {showOtpForm ? (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowOtpForm(false)}
                  className="text-white hover:bg-white/10 p-0 h-auto text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-white text-sm">Código de Verificación</Label>
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-primary hover:bg-white/90"
                    disabled={loading}
                  >
                    {loading ? 'Verificando...' : 'Verificar Código'}
                  </Button>
                </form>
              </div>
            ) : showNewPasswordForm ? (
              <div className="space-y-4">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-white text-sm">Nueva Contraseña</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <p className="text-xs text-white/60">Mínimo 6 caracteres</p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-primary hover:bg-white/90"
                    disabled={loading}
                  >
                    {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </Button>
                </form>
              </div>
            ) : showResetForm ? (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowResetForm(false)}
                  className="text-white hover:bg-white/10 p-0 h-auto text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al inicio de sesión
                </Button>
                
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-white text-sm">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-primary hover:bg-white/90"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Email de Recuperación'}
                  </Button>
                  <p className="text-xs text-white/60 text-center">
                    Recibirás un enlace que expira en 1 hora
                  </p>
                </form>
              </div>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/20">
                  <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-primary text-sm">
                    Iniciar Sesión
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-primary text-sm">
                    Registrarse
                  </TabsTrigger>
                </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white text-sm">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                      placeholder="••••••••"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-primary hover:bg-white/90"
                    disabled={loading}
                  >
                    {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                  </Button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowResetForm(true)}
                      className="text-white/70 hover:text-white text-xs sm:text-sm underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <div className="mb-4 flex gap-2">
                  <Button
                    type="button"
                    variant={signupMethod === 'email' ? 'default' : 'outline'}
                    onClick={() => setSignupMethod('email')}
                    className={`flex-1 ${signupMethod === 'email' ? 'bg-white text-primary' : 'bg-white/20 text-white border-white/30'}`}
                    size="sm"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    type="button"
                    variant={signupMethod === 'phone' ? 'default' : 'outline'}
                    onClick={() => setSignupMethod('phone')}
                    className={`flex-1 ${signupMethod === 'phone' ? 'bg-white text-primary' : 'bg-white/20 text-white border-white/30'}`}
                    size="sm"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Teléfono
                  </Button>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white text-sm">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  {signupMethod === 'email' ? (
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-white text-sm">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                        placeholder="tu@email.com"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="phone-signup" className="text-white text-sm">Teléfono</Label>
                      <Input
                        id="phone-signup"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                        placeholder="+584121234567 o 04121234567"
                      />
                      <p className="text-xs text-white/60">Número venezolano</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white text-sm">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <p className="text-xs text-white/60">Mínimo 6 caracteres</p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-primary hover:bg-white/90"
                    disabled={loading}
                  >
                    {loading ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
              </Tabs>
            )}

            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center justify-center space-x-4 sm:space-x-6 text-white/60 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Seguro</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Rápido</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wifi className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>24/7</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
