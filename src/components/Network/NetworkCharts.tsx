import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { NetworkDevice } from "@/pages/NetworkManagement";

interface NetworkChartsProps {
  devices: NetworkDevice[];
  isLoading: boolean;
}

const NetworkCharts = ({ devices, isLoading }: NetworkChartsProps) => {
  // Status distribution data
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;
  const maintenanceCount = devices.filter(d => d.status === 'maintenance').length;

  const statusData = [
    { name: 'Online', value: onlineCount, color: 'hsl(134, 61%, 41%)' },
    { name: 'Offline', value: offlineCount, color: 'hsl(0, 72%, 51%)' },
    { name: 'Mantenimiento', value: maintenanceCount, color: 'hsl(45, 100%, 51%)' },
  ].filter(d => d.value > 0);

  // Device type distribution data
  const typeData = [
    { 
      name: 'Servidores', 
      total: devices.filter(d => d.device_type === 'servidor').length,
      online: devices.filter(d => d.device_type === 'servidor' && d.status === 'online').length,
    },
    { 
      name: 'Nodos', 
      total: devices.filter(d => d.device_type === 'nodo').length,
      online: devices.filter(d => d.device_type === 'nodo' && d.status === 'online').length,
    },
    { 
      name: 'Troncales', 
      total: devices.filter(d => d.device_type === 'troncal').length,
      online: devices.filter(d => d.device_type === 'troncal' && d.status === 'online').length,
    },
    { 
      name: 'CPEs', 
      total: devices.filter(d => d.device_type === 'cpe').length,
      online: devices.filter(d => d.device_type === 'cpe' && d.status === 'online').length,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 animate-pulse bg-secondary/20">
          <div className="h-[200px]"></div>
        </Card>
        <Card className="p-6 animate-pulse bg-secondary/20">
          <div className="h-[200px]"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Status Distribution Pie Chart */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Distribución de Estados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} dispositivos`, '']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Type Bar Chart */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Dispositivos por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {devices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} dispositivos`, 
                      name === 'total' ? 'Total' : 'Online'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="Total" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="online" fill="hsl(134, 61%, 41%)" name="Online" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkCharts;
