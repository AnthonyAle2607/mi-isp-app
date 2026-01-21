// Service plans configuration
export interface ServicePlan {
  id: string;
  name: string;
  connection_type: 'fibra' | 'radio';
  speed_mbps: number;
  monthly_price: number;
  is_active: boolean;
}

export const CONNECTION_TYPES = {
  fibra: 'Fibra Óptica',
  radio: 'Radiofrecuencia'
} as const;

export const CEDULA_TYPES = ['V', 'E', 'J', 'G'] as const;

export const ESTADOS_VENEZUELA = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
  'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
  'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta',
  'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
];

// Helper to format price
export const formatPrice = (price: number) => `$${price.toFixed(2)}`;

// Helper to format speed
export const formatSpeed = (mbps: number) => mbps >= 1000 ? `${mbps / 1000} Gbps` : `${mbps} Mbps`;

// Helper to get plan display name
export const getPlanDisplayName = (plan: ServicePlan) => 
  `${plan.name} - ${formatPrice(plan.monthly_price)}/mes`;

// Check if user can downgrade (only first 5 days of month)
export const canDowngradePlan = () => {
  const today = new Date();
  return today.getDate() <= 5;
};

// Calculate proration for upgrade
export const calculateProration = (
  currentPlanPrice: number,
  newPlanPrice: number,
  currentBalance: number
): { adjustment: number; newBalance: number; daysRemaining: number; daysUsed: number } => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  const daysUsed = currentDay;
  const daysRemaining = daysInMonth - currentDay;

  // Daily rate for old plan (days used)
  const oldDailyRate = currentPlanPrice / daysInMonth;
  const usedAmount = oldDailyRate * daysUsed;

  // Daily rate for new plan (days remaining)
  const newDailyRate = newPlanPrice / daysInMonth;
  const remainingAmount = newDailyRate * daysRemaining;

  // Total for this month
  const adjustment = usedAmount + remainingAmount - currentPlanPrice;
  const newBalance = currentBalance + adjustment;

  return {
    adjustment: Math.round(adjustment * 100) / 100,
    newBalance: Math.round(newBalance * 100) / 100,
    daysRemaining,
    daysUsed
  };
};
