import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

const StatsCard = ({ title, value, subtitle, icon, trend = "neutral", className }: StatsCardProps) => {
  return (
    <Card className={cn(
      "p-6 bg-gradient-to-br from-card to-secondary/20 border border-border/50",
      "hover:shadow-lg hover:shadow-primary/10 transition-all duration-300",
      "backdrop-blur-sm",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className={cn(
                "text-sm font-medium",
                trend === "up" && "text-success-green",
                trend === "down" && "text-destructive",
                trend === "neutral" && "text-muted-foreground"
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <div className="text-primary">
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;