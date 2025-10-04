import { useState } from 'react';
import { DollarSign, Copy, Check, CreditCard, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentMethods = () => {
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const paymentMethods = {
    dolares: [
      {
        id: 'zelle',
        name: 'Zelle',
        icon: CreditCard,
        details: [
          { label: 'Email', value: 'cobranzasdelgrupo@gmail.com' },
          { label: 'Nombre', value: '869 Nw 97 court LLC' }
        ]
      },
      {
        id: 'bnc-dolares',
        name: 'BNC (Solo depósito en dólares)',
        icon: Building2,
        details: [
          { label: 'Cuenta', value: '0191-0166-57-2300006629' },
          { label: 'Beneficiario', value: 'Telecomunicaciones Silverdata C.A.' },
          { label: 'RIF', value: 'J-50057920-9' }
        ]
      }
    ],
    bolivares: [
      {
        id: 'bnc-bolivares',
        name: 'BNC',
        icon: Building2,
        details: [
          { label: 'Cuenta', value: '0191-0166-52-2100032181' },
          { label: 'Banco', value: 'Banco Nacional de Credito' },
          { label: 'Pago Móvil', value: '(0416) 517 5255' },
          { label: 'Beneficiario', value: 'Silverdata C.A.' },
          { label: 'RIF', value: 'J-50057920-9' }
        ]
      }
    ]
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({
      title: "Copiado",
      description: `${fieldName} copiado al portapapeles`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleMethod = (methodId: string) => {
    setExpandedMethod(expandedMethod === methodId ? null : methodId);
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-primary/30 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold text-foreground mb-6 flex items-center">
        <DollarSign className="h-6 w-6 mr-2 text-primary" />
        Formas de Pago
      </h3>

      {/* Pagos en Dólares */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-foreground mb-3">Pagos en Dólares</h4>
        <div className="space-y-3">
          {paymentMethods.dolares.map((method) => {
            const IconComponent = method.icon;
            return (
              <div key={method.id} className="border border-border/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleMethod(method.id)}
                  className="w-full p-4 bg-secondary/20 hover:bg-secondary/30 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">{method.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {expandedMethod === method.id ? '▼' : '▶'}
                  </span>
                </button>
                
                {expandedMethod === method.id && (
                  <div className="p-4 bg-card/30 space-y-3">
                    {method.details.map((detail, index) => (
                      <div key={index} className="flex items-center justify-between bg-background/50 p-3 rounded">
                        <div>
                          <p className="text-sm text-muted-foreground">{detail.label}</p>
                          <p className="font-semibold text-foreground">{detail.value}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(detail.value, detail.label)}
                          className="p-2 border border-border/50 hover:bg-secondary/30 rounded transition-colors"
                        >
                          {copiedField === detail.label ? (
                            <Check className="h-4 w-4 text-success-green" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagos en Bolívares */}
      <div>
        <h4 className="text-lg font-semibold text-foreground mb-3">Pagos en Bolívares</h4>
        <div className="space-y-3">
          {paymentMethods.bolivares.map((method) => {
            const IconComponent = method.icon;
            return (
              <div key={method.id} className="border border-border/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleMethod(method.id)}
                  className="w-full p-4 bg-secondary/20 hover:bg-secondary/30 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">{method.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {expandedMethod === method.id ? '▼' : '▶'}
                  </span>
                </button>
                
                {expandedMethod === method.id && (
                  <div className="p-4 bg-card/30 space-y-3">
                    {method.details.map((detail, index) => (
                      <div key={index} className="flex items-center justify-between bg-background/50 p-3 rounded">
                        <div>
                          <p className="text-sm text-muted-foreground">{detail.label}</p>
                          <p className="font-semibold text-foreground">{detail.value}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(detail.value, detail.label)}
                          className="p-2 border border-border/50 hover:bg-secondary/30 rounded transition-colors"
                        >
                          {copiedField === detail.label ? (
                            <Check className="h-4 w-4 text-success-green" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
