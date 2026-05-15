/**
 * Utilidades para cálculos de nómina (Estándar Colombia 2024)
 */

export const PAYROLL_CONSTANTS = {
  MINIMUM_WAGE: 1300000,
  TRANSPORT_AID: 162000,
  HEALTH_RATE: 0.04,
  PENSION_RATE: 0.04,
};

export function calculateLiquidation(baseSalary: number, daysWorked: number, hasTransportAid: boolean) {
  const dayValue = baseSalary / 30;
  const basePeriod = dayValue * daysWorked;
  
  // El auxilio de transporte solo aplica si gana menos de 2 salarios mínimos
  const transportAidValue = (hasTransportAid && baseSalary <= (PAYROLL_CONSTANTS.MINIMUM_WAGE * 2)) 
    ? (PAYROLL_CONSTANTS.TRANSPORT_AID / 30) * daysWorked 
    : 0;

  const healthDeduction = basePeriod * PAYROLL_CONSTANTS.HEALTH_RATE;
  const pensionDeduction = basePeriod * PAYROLL_CONSTANTS.PENSION_RATE;
  
  const totalDeductions = healthDeduction + pensionDeduction;
  const netSalary = basePeriod + transportAidValue - totalDeductions;

  return {
    basePeriod,
    transportAid: transportAidValue,
    healthDeduction,
    pensionDeduction,
    totalDeductions,
    netSalary,
    daysWorked
  };
}
