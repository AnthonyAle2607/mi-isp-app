import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Wifi, Shield, Zap, ArrowLeft, Phone, Mail, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
    if (user) navigate('/');
    if (searchParams.get('reset') === 'true') setShowNewPasswordForm(true);
  }, [user, navigate, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Error de validación", description: error.errors[0].message, variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    if (!error) navigate('/');
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
        toast({ title: "Error de validación", description: error.errors[0].message, variant: "destructive" });
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
    if (verificationMethod === 'phone') await resendPhoneOtp(registeredPhone);
    else await resendEmailOtp(registeredEmail);
    setLoading(false);
  };

  const handleChooseVerification = (method: 'email' | 'phone') => {
    setVerificationMethod(method);
    setShowVerificationChoice(false);
    setShowOtpForm(true);
    if (method === 'phone') resendPhoneOtp(registeredPhone);
    else resendEmailOtp(registeredEmail);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(resetEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Error de validación", description: error.errors[0].message, variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    const { error } = await resetPassword(resetEmail);
    setLoading(false);
    if (!error) { setShowResetForm(false); setResetEmail(''); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Error de validación", description: error.errors[0].message, variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    if (!error) { setShowNewPasswordForm(false); navigate('/'); }
  };

  const inputClass = "bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all";

  const getTitle = () => {
    if (showResetForm) return "Recuperar Contraseña";
    if (showNewPasswordForm) return "Nueva Contraseña";
    if (showVerificationChoice) return "Verificar Cuenta";
    if (showOtpForm) return "Ingresa el Código";
    return null;
  };

  const getSubtitle = () => {
    if (showResetForm) return "Recibirás un enlace en tu correo";
    if (showNewPasswordForm) return "Crea tu nueva contraseña segura";
    if (showVerificationChoice) return "Elige cómo verificar tu cuenta";
    if (showOtpForm) return `Código enviado a tu ${verificationMethod === 'phone' ? 'teléfono' : 'correo'}`;
    return null;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[hsl(220,28%,10%)] to-[hsl(220,30%,5%)] flex-col items-center justify-center p-12">
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-primary/8 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 text-center space-y-8 max-w-md">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <img
                src="/silverdata-logo.png"
                alt="Silverdata"
                className="h-16 w-16 rounded-xl"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-3">
              <span className="text-foreground">SILVER</span>
              <span className="gradient-text">DATA</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Internet de alta velocidad para toda la familia.<br />Estabilidad garantizada 24/7.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { icon: Shield, label: "Seguro", desc: "Conexión cifrada" },
              { icon: Zap, label: "Rápido", desc: "Alta velocidad" },
              { icon: Wifi, label: "24/7", desc: "Siempre activo" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="glass-card rounded-xl p-4 text-center space-y-2">
                <Icon className="h-6 w-6 text-primary mx-auto" />
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-sm fade-in-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <img
              src="/silverdata-logo.png"
              alt="Silverdata"
              className="h-10 w-10 rounded-lg"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-2xl font-bold">
              <span className="text-foreground">SILVER</span>
              <span className="gradient-text">DATA</span>
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            {getTitle() ? (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-1">{getTitle()}</h2>
                <p className="text-muted-foreground text-sm">{getSubtitle()}</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-1">Bienvenido</h2>
                <p className="text-muted-foreground text-sm">Accede a tu portal de servicios</p>
              </>
            )}
          </div>

          {/* Forms */}
          {showVerificationChoice ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => { setShowVerificationChoice(false); setRegisteredEmail(''); setRegisteredPhone(''); }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" /> Volver
              </button>
              <div className="space-y-3">
                <button
                  onClick={() => handleChooseVerification('email')}
                  className="w-full p-4 rounded-xl glass-card hover:border-primary/40 transition-all flex items-center gap-3 text-left group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Verificar por Correo</p>
                    <p className="text-xs text-muted-foreground">{registeredEmail}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleChooseVerification('phone')}
                  className="w-full p-4 rounded-xl glass-card hover:border-primary/40 transition-all flex items-center gap-3 text-left group"
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Verificar por SMS</p>
                    <p className="text-xs text-muted-foreground">{registeredPhone}</p>
                  </div>
                </button>
              </div>
            </div>

          ) : showOtpForm ? (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => { setShowOtpForm(false); setShowVerificationChoice(true); setOtp(''); }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Volver
              </button>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-foreground/80">Código de Verificación</Label>
                  <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required className={inputClass} placeholder="123456" maxLength={6} />
                  <p className="text-xs text-muted-foreground">Enviado a: {verificationMethod === 'phone' ? registeredPhone : registeredEmail}</p>
                </div>
                <Button type="submit" className="w-full shine" disabled={loading}>
                  {loading ? 'Verificando...' : 'Verificar Código'}
                </Button>
                <Button type="button" variant="ghost" onClick={handleResendOtp} className="w-full text-muted-foreground hover:text-foreground text-sm" disabled={loading}>
                  Reenviar código
                </Button>
              </form>
            </div>

          ) : showNewPasswordForm ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium text-foreground/80">Nueva Contraseña</Label>
                <div className="relative">
                  <Input id="new-password" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={`${inputClass} pr-10`} placeholder="••••••••" minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
              </div>
              <Button type="submit" className="w-full shine" disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>
            </form>

          ) : showResetForm ? (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => setShowResetForm(false)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Volver al inicio
              </button>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium text-foreground/80">Correo Electrónico</Label>
                  <Input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required className={inputClass} placeholder="tu@email.com" />
                </div>
                <Button type="submit" className="w-full shine" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">El enlace expira en 1 hora</p>
              </form>
            </div>

          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/50 border border-border/40 mb-6">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium transition-all">
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm font-medium transition-all">
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Correo Electrónico</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="tu@email.com" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Contraseña</Label>
                      <button type="button" onClick={() => setShowResetForm(true)} className="text-xs text-primary hover:text-primary/80 transition-colors">
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className={`${inputClass} pr-10`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-2 shine font-semibold" disabled={loading}>
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground/80">Nombre Completo</Label>
                    <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} placeholder="Tu nombre completo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium text-foreground/80">Correo Electrónico</Label>
                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="tu@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-signup" className="text-sm font-medium text-foreground/80">Teléfono</Label>
                    <Input id="phone-signup" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputClass} placeholder="+584121234567 o 04121234567" />
                    <p className="text-xs text-muted-foreground">Número venezolano</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium text-foreground/80">Contraseña</Label>
                    <div className="relative">
                      <Input id="signup-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className={`${inputClass} pr-10`} placeholder="••••••••" minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                  </div>
                  <Button type="submit" className="w-full mt-2 shine font-semibold" disabled={loading}>
                    {loading ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {/* Footer badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            {[
              { icon: Shield, label: "Seguro" },
              { icon: Zap, label: "Rápido" },
              { icon: Wifi, label: "24/7" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
