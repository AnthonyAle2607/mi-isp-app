import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Wifi, Shield, Zap, ChevronRight, Phone, MapPin, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import silverdataLogo from '@/assets/silverdata-logo.png';

interface Plan {
  id: string;
  name: string;
  speed_mbps: number;
  monthly_price: number;
  connection_type: string;
}

const Landing = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    supabase
      .from('service_plans')
      .select('id, name, speed_mbps, monthly_price, connection_type')
      .eq('is_active', true)
      .order('monthly_price', { ascending: true })
      .then(({ data }) => setPlans(data || []));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-card border-b border-border/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={silverdataLogo} alt="Silverdata" className="h-9 w-9 rounded-lg object-cover" />
            <span className="text-lg font-bold">
              <span className="text-foreground">SILVER</span>
              <span className="gradient-text">DATA</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#planes" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Planes</a>
            <a href="#beneficios" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Beneficios</a>
            <a href="#contacto" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Contacto</a>
            <Button onClick={() => navigate('/auth')} size="sm" className="shine">
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Wifi className="h-4 w-4" />
            Internet de alta velocidad
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Conecta con <span className="gradient-text">Silverdata</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Internet ilimitado con fibra óptica y radiofrecuencia. Estabilidad garantizada 24/7 para hogares y empresas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="shine text-base px-8">
              Contratar Ahora <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' })} className="text-base px-8">
              Ver Planes
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            ¿Por qué <span className="gradient-text">Silverdata</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'Ultra Rápido', desc: 'Velocidades de hasta 1 Gbps con fibra óptica de última generación.' },
              { icon: Shield, title: 'Seguro', desc: 'Conexión cifrada y protegida. Tu privacidad es nuestra prioridad.' },
              { icon: Clock, title: '24/7 Soporte', desc: 'Asistencia técnica disponible las 24 horas, todos los días del año.' },
              { icon: Star, title: 'Sin Límites', desc: 'Internet verdaderamente ilimitado. Sin restricciones de descarga.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card rounded-xl p-6 text-center space-y-3 hover:border-primary/30 transition-all group">
                <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="planes" className="py-16 sm:py-24 bg-secondary/10">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Nuestros <span className="gradient-text">Planes</span></h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">Elige el plan que mejor se adapte a tus necesidades.</p>
          {plans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {plans.map((plan, idx) => (
                <div
                  key={plan.id}
                  className={`glass-card rounded-2xl p-6 space-y-4 relative transition-all hover:scale-[1.02] ${
                    idx === 1 ? 'border-primary/40 glow-border' : ''
                  }`}
                >
                  {idx === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      Popular
                    </div>
                  )}
                  <div className="text-center space-y-1">
                    <p className="text-xs font-medium text-primary uppercase tracking-wider">
                      {plan.connection_type === 'fibra' ? 'Fibra Óptica' : 'Radiofrecuencia'}
                    </p>
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl font-bold gradient-text">${plan.monthly_price.toFixed(2)}</span>
                    <span className="text-muted-foreground text-sm">/mes</span>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-foreground">{plan.speed_mbps}</span>
                    <span className="text-muted-foreground text-sm"> Mbps</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><span className="text-success-green">✓</span> Internet ilimitado</li>
                    <li className="flex items-center gap-2"><span className="text-success-green">✓</span> IP estática incluida</li>
                    <li className="flex items-center gap-2"><span className="text-success-green">✓</span> Soporte 24/7</li>
                  </ul>
                  <Button className="w-full shine" onClick={() => navigate('/auth')}>
                    Contratar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>Cargando planes disponibles...</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="gradient-text">Contáctanos</span>
          </h2>
          <p className="text-muted-foreground text-center mb-10">¿Tienes preguntas? Estamos aquí para ayudarte.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="glass-card rounded-xl p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Teléfono</p>
                <p className="text-sm text-muted-foreground">+58 412-123-4567</p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Ubicación</p>
                <p className="text-sm text-muted-foreground">Venezuela</p>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); }}
            className="glass-card rounded-2xl p-6 sm:p-8 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">Nombre</label>
                <input className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border/40 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder="Tu nombre" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">Teléfono</label>
                <input className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border/40 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder="+58 412..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Email</label>
              <input type="email" className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border/40 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder="tu@email.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Mensaje</label>
              <textarea rows={4} className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border/40 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" placeholder="¿En qué podemos ayudarte?" />
            </div>
            <Button type="submit" className="w-full shine">Enviar Mensaje</Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={silverdataLogo} alt="Silverdata" className="h-7 w-7 rounded-md" />
            <span className="text-sm font-bold">
              <span className="text-foreground">SILVER</span>
              <span className="gradient-text">DATA</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Silverdata. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
