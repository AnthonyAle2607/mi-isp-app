import { useEffect, useRef } from 'react';

interface SpeedTestChartProps {
  data: number[];
  isDownload: boolean;
  label: string;
  maxPoints?: number;
}

const SpeedTestChart = ({ data, isDownload, label, maxPoints = 50 }: SpeedTestChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 30, right: 10, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = 'hsl(var(--secondary) / 0.3)';
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = 'hsl(var(--border) / 0.3)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    if (data.length < 2) return;

    const maxValue = Math.max(...data, 1) * 1.2;
    const pointSpacing = chartWidth / (maxPoints - 1);

    // Create gradient for fill
    const fillGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    if (isDownload) {
      fillGradient.addColorStop(0, 'rgba(6, 182, 212, 0.6)');
      fillGradient.addColorStop(1, 'rgba(6, 182, 212, 0.1)');
    } else {
      fillGradient.addColorStop(0, 'rgba(34, 197, 94, 0.6)');
      fillGradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
    }

    // Draw filled area
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    
    data.forEach((value, index) => {
      const x = padding.left + index * pointSpacing;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        // Smooth curve
        const prevX = padding.left + (index - 1) * pointSpacing;
        const prevY = padding.top + chartHeight - (data[index - 1] / maxValue) * chartHeight;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
        if (index === data.length - 1) {
          ctx.quadraticCurveTo(cpX, (prevY + y) / 2, x, y);
        }
      }
    });
    
    ctx.lineTo(padding.left + (data.length - 1) * pointSpacing, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = fillGradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    data.forEach((value, index) => {
      const x = padding.left + index * pointSpacing;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = padding.left + (index - 1) * pointSpacing;
        const prevY = padding.top + chartHeight - (data[index - 1] / maxValue) * chartHeight;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
        if (index === data.length - 1) {
          ctx.quadraticCurveTo(cpX, (prevY + y) / 2, x, y);
        }
      }
    });
    
    ctx.strokeStyle = isDownload ? '#06b6d4' : '#22c55e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw label
    ctx.fillStyle = isDownload ? '#06b6d4' : '#22c55e';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    
    // Draw icon
    const iconX = padding.left + 10;
    const iconY = 18;
    ctx.beginPath();
    if (isDownload) {
      ctx.moveTo(iconX, iconY - 6);
      ctx.lineTo(iconX - 5, iconY);
      ctx.lineTo(iconX + 5, iconY);
    } else {
      ctx.moveTo(iconX, iconY + 6);
      ctx.lineTo(iconX - 5, iconY);
      ctx.lineTo(iconX + 5, iconY);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.fillText(label, iconX + 12, iconY + 4);

    // Draw Y-axis labels
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const value = (maxValue / 5) * (5 - i);
      const y = padding.top + (chartHeight / 5) * i;
      ctx.fillText(`${Math.round(value)}`, width - padding.right - 5, y + 4);
    }
  }, [data, isDownload, label, maxPoints]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={180}
      className="w-full h-auto rounded-lg"
    />
  );
};

export default SpeedTestChart;
