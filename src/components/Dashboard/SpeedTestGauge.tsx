import { useEffect, useRef } from 'react';

interface SpeedTestGaugeProps {
  value: number;
  maxValue: number;
  isDownload: boolean;
  isActive: boolean;
  label: string;
}

const SpeedTestGauge = ({ value, maxValue, isDownload, isActive, label }: SpeedTestGaugeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedValue = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 20;
    const radius = Math.min(centerX, centerY) - 30;

    const animate = () => {
      // Smooth animation towards target value
      const diff = value - animatedValue.current;
      animatedValue.current += diff * 0.1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw gauge background arc
      const startAngle = Math.PI * 0.75;
      const endAngle = Math.PI * 2.25;
      const totalAngle = endAngle - startAngle;

      // Draw colored segments
      const segments = [
        { color: '#ef4444', start: 0, end: 0.1 },      // Red (0-10%)
        { color: '#f97316', start: 0.1, end: 0.25 },   // Orange (10-25%)
        { color: '#eab308', start: 0.25, end: 0.45 },  // Yellow (25-45%)
        { color: '#22c55e', start: 0.45, end: 0.7 },   // Green (45-70%)
        { color: '#06b6d4', start: 0.7, end: 0.9 },    // Cyan (70-90%)
        { color: '#3b82f6', start: 0.9, end: 1 },      // Blue (90-100%)
      ];

      segments.forEach(segment => {
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          radius,
          startAngle + totalAngle * segment.start,
          startAngle + totalAngle * segment.end,
          false
        );
        ctx.strokeStyle = segment.color;
        ctx.lineWidth = 20;
        ctx.lineCap = 'butt';
        ctx.stroke();
      });

      // Draw inner dark arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 25, startAngle, endAngle, false);
      ctx.strokeStyle = 'hsl(var(--secondary))';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Draw progress arc
      const progress = Math.min(animatedValue.current / maxValue, 1);
      const progressAngle = startAngle + totalAngle * progress;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 25, startAngle, progressAngle, false);
      const progressGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      progressGradient.addColorStop(0, isDownload ? '#06b6d4' : '#22c55e');
      progressGradient.addColorStop(1, isDownload ? '#3b82f6' : '#10b981');
      ctx.strokeStyle = progressGradient;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw tick marks
      for (let i = 0; i <= 10; i++) {
        const tickAngle = startAngle + (totalAngle / 10) * i;
        const innerRadius = radius + 5;
        const outerRadius = radius + 15;
        
        ctx.beginPath();
        ctx.moveTo(
          centerX + Math.cos(tickAngle) * innerRadius,
          centerY + Math.sin(tickAngle) * innerRadius
        );
        ctx.lineTo(
          centerX + Math.cos(tickAngle) * outerRadius,
          centerY + Math.sin(tickAngle) * outerRadius
        );
        ctx.strokeStyle = 'hsl(var(--muted-foreground))';
        ctx.lineWidth = i % 5 === 0 ? 3 : 1;
        ctx.stroke();
      }

      // Draw needle
      const needleAngle = startAngle + totalAngle * progress;
      const needleLength = radius - 45;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(needleAngle);
      
      // Needle shadow
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Needle body
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(0, -needleLength);
      ctx.lineTo(8, 0);
      ctx.closePath();
      ctx.fillStyle = isDownload ? '#06b6d4' : '#22c55e';
      ctx.fill();
      
      ctx.restore();

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'hsl(var(--card))';
      ctx.fill();
      ctx.strokeStyle = isDownload ? '#06b6d4' : '#22c55e';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw arrow icon in center
      ctx.beginPath();
      if (isDownload) {
        // Down arrow
        ctx.moveTo(centerX, centerY + 8);
        ctx.lineTo(centerX - 6, centerY - 2);
        ctx.lineTo(centerX + 6, centerY - 2);
      } else {
        // Up arrow
        ctx.moveTo(centerX, centerY - 8);
        ctx.lineTo(centerX - 6, centerY + 2);
        ctx.lineTo(centerX + 6, centerY + 2);
      }
      ctx.closePath();
      ctx.fillStyle = isDownload ? '#06b6d4' : '#22c55e';
      ctx.fill();

      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, maxValue, isDownload, isActive]);

  return (
    <div className="relative flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={280}
        height={200}
        className="w-full max-w-[280px]"
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-4 text-center">
        <div className="text-3xl font-bold text-foreground">
          {value.toFixed(2)}
        </div>
        <div className="text-sm text-muted-foreground">Mb/s</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
};

export default SpeedTestGauge;
