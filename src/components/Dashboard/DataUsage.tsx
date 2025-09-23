import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, Download, Upload } from "lucide-react";

const DataUsage = () => {
  const monthlyQuota = 500; // GB
  const usedData = 327.5; // GB
  const usagePercentage = (usedData / monthlyQuota) * 100;

  const dailyUsage = [
    { day: 'Lun', download: 12.3, upload: 2.1 },
    { day: 'Mar', download: 15.7, upload: 3.2 },
    { day: 'Mie', download: 18.9, upload: 4.1 },
    { day: 'Jue', download: 14.2, upload: 2.8 },
    { day: 'Vie', download: 22.1, upload: 5.3 },
    { day: 'Sab', download: 28.4, upload: 6.7 },
    { day: 'Dom', download: 25.6, upload: 4.9 },
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50">
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Consumo de Datos</h3>
            <p className="text-sm text-muted-foreground">Uso mensual y estadísticas</p>
          </div>
        </div>

        {/* Monthly Usage Overview */}
        <div className="bg-secondary/20 rounded-lg p-4 border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">Consumo del Mes</p>
              <p className="text-2xl font-bold text-foreground">
                {usedData} GB <span className="text-sm font-normal text-muted-foreground">/ {monthlyQuota} GB</span>
              </p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              usagePercentage >= 90 ? 'bg-destructive/10 text-destructive' :
              usagePercentage >= 70 ? 'bg-warning-orange/10 text-warning-orange' :
              'bg-success-green/10 text-success-green'
            }`}>
              {usagePercentage.toFixed(1)}%
            </div>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className={`h-3 ${
              usagePercentage >= 90 ? '[&>div]:bg-destructive' :
              usagePercentage >= 70 ? '[&>div]:bg-warning-orange' :
              '[&>div]:bg-success-green'
            }`}
          />
          
          <p className="text-xs text-muted-foreground mt-2">
            Quedan {(monthlyQuota - usedData).toFixed(1)} GB disponibles
          </p>
        </div>

        {/* Weekly Usage Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">Uso Semanal (GB)</h4>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {dailyUsage.map((day, index) => (
              <div key={index} className="bg-secondary/20 rounded-lg p-2 text-center border border-border/30">
                <p className="text-xs text-muted-foreground font-medium">{day.day}</p>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center justify-center space-x-1">
                    <Download className="h-3 w-3 text-primary" />
                    <span className="text-xs font-bold text-foreground">{day.download}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    <Upload className="h-3 w-3 text-success-green" />
                    <span className="text-xs font-bold text-foreground">{day.upload}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Insights */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-primary/10 rounded">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Insight del Mes</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tu consumo promedio diario es de 10.9 GB. Al ritmo actual, usarás aproximadamente 
                {Math.round((usedData / new Date().getDate()) * 30)} GB este mes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DataUsage;