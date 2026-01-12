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
  const [showVerificationChoice, setShowVerificationChoice] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone'>('email');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const { signIn, signUpWithBoth, verifyOtp, verifyEmailOtp, resendEmailOtp, resendPhoneOtp, resetPassword, updatePassword, user } = useAuth();
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
      emailSchema.parse(email);
      phoneSchema.parse(phone);
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
    const { error } = await signUpWithBoth(email, phone, password, fullName);
    
    if (!error) {
      setRegisteredEmail(email);
      setRegisteredPhone(phone);
      setShowVerificationChoice(true);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = verificationMethod === 'phone' 
      ? await verifyOtp(registeredPhone, otp)
      : await verifyEmailOtp(registeredEmail, otp);
    if (!error) {
      setShowOtpForm(false);
      setShowVerificationChoice(false);
      navigate('/');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    if (verificationMethod === 'phone') {
      await resendPhoneOtp(registeredPhone);
    } else {
      await resendEmailOtp(registeredEmail);
    }
    setLoading(false);
  };

  const handleChooseVerification = (method: 'email' | 'phone') => {
    setVerificationMethod(method);
    setShowVerificationChoice(false);
    setShowOtpForm(true);
    
    // Enviar el código según el método elegido
    if (method === 'phone') {
      resendPhoneOtp(registeredPhone);
    } else {
      resendEmailOtp(registeredEmail);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(216,71%,6%)] via-[hsl(216,71%,10%)] to-[hsl(216,71%,15%)] flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center items-center gap-2 mb-3 sm:mb-4">
            <img 
              src="/silverdata-logo.png" 
              alt="Silverdata Logo" 
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">
              <span className="text-white">SILVER</span>
              <span className="text-primary">DATA</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base text-white/80">Internet ilimitado para toda la familia</p>
        </div>

        <Card className="backdrop-blur-sm bg-[hsl(216,71%,12%)]/80 border-white/10 shadow-2xl">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl text-white">
              {showResetForm ? "Recuperar Contraseña" : showNewPasswordForm ? "Nueva Contraseña" : showVerificationChoice ? "Verificar Cuenta" : showOtpForm ? "Verificar Código" : "Acceso al Portal"}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-white/70">
              {showResetForm ? "Ingresa tu email para restablecer tu contraseña" : showNewPasswordForm ? "Crea tu nueva contraseña" : showVerificationChoice ? "Elige cómo deseas verificar tu cuenta" : showOtpForm ? `Ingresa el código enviado a tu ${verificationMethod === 'phone' ? 'teléfono' : 'correo'}` : "Gestiona tu servicio de internet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {showVerificationChoice ? (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowVerificationChoice(false);
                    setRegisteredEmail('');
                    setRegisteredPhone('');
                  }}
                  className="text-white hover:bg-white/10 p-0 h-auto text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
                
                <div className="space-y-3">
                  <p className="text-white/80 text-sm text-center mb-4">
                    Selecciona cómo deseas verificar tu cuenta
                  </p>
                  <Button
                    type="button"
                    onClick={() => handleChooseVerification('email')}
                    className="w-full bg-white text-primary hover:bg-white/90 flex items-center justify-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Verificar por Correo
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleChooseVerification('phone')}
                    className="w-full bg-white text-primary hover:bg-white/90 flex items-center justify-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Verificar por SMS
                  </Button>
                </div>
              </div>
            ) : showOtpForm ? (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowOtpForm(false);
                    setShowVerificationChoice(true);
                    setOtp('');
                  }}
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
                    <p className="text-xs text-white/60">
                      Código enviado a: {verificationMethod === 'phone' ? registeredPhone : registeredEmail}
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-primary hover:bg-white/90"
                    disabled={loading}
                  >
                    {loading ? 'Verificando...' : 'Verificar Código'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendOtp}
                    className="w-full text-white hover:bg-white/10 text-sm"
                    disabled={loading}
                  >
                    Reenviar código
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
