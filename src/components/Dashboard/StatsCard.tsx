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
    <div className={cn(
      "glass-card rounded-xl p-5 relative overflow-hidden group",
      "hover:shadow-lg hover:shadow-primary/10 transition-all duration-300",
      className
    )}>
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500" />
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className={cn(
                "text-xs font-medium",
                trend === "up" && "text-success-green",
                trend === "down" && "text-destructive",
                trend === "neutral" && "text-muted-foreground"
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/10">
          <div className="text-primary">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;