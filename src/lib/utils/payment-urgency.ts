// lib/utils/payment-urgency.ts — Calcula urgencia de pagos
import { differenceInDays, startOfDay } from 'date-fns';

export type UrgencyLevel = 'overdue' | 'critical' | 'warning' | 'ok';

export interface PaymentUrgency {
  level: UrgencyLevel;
  daysUntilDue: number;
  label: string;
  color: string;
  bgColor: string;
}

/**
 * Calcula la urgencia de un pago basándose en la fecha de vencimiento
 */
export function calculateUrgency(dueDate: Date | string): PaymentUrgency {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const daysUntilDue = differenceInDays(due, today);

  if (daysUntilDue < 0) {
    return {
      level: 'overdue',
      daysUntilDue,
      label: `Vencido hace ${Math.abs(daysUntilDue)} día(s)`,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    };
  }

  if (daysUntilDue <= 2) {
    return {
      level: 'critical',
      daysUntilDue,
      label: daysUntilDue === 0 ? 'Vence hoy' : `Vence en ${daysUntilDue} día(s)`,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    };
  }

  if (daysUntilDue <= 5) {
    return {
      level: 'warning',
      daysUntilDue,
      label: `Vence en ${daysUntilDue} días`,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    };
  }

  return {
    level: 'ok',
    daysUntilDue,
    label: `Vence en ${daysUntilDue} días`,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  };
}

/**
 * Mapa de categorías de pago a nombres legibles en español
 */
export const CATEGORY_LABELS: Record<string, string> = {
  ARRIENDO: 'Arriendo',
  IMPUESTOS: 'Impuestos',
  NOMINA: 'Nómina',
  PROVEEDORES: 'Proveedores',
  SERVICIOS: 'Servicios',
  SEGUROS: 'Seguros',
  MANTENIMIENTO: 'Mantenimiento',
  CREDITOS: 'Créditos',
  OTROS: 'Otros',
};

export const CATEGORY_COLORS: Record<string, string> = {
  ARRIENDO: '#f59e0b',
  IMPUESTOS: '#ef4444',
  NOMINA: '#3b82f6',
  PROVEEDORES: '#8b5cf6',
  SERVICIOS: '#06b6d4',
  SEGUROS: '#10b981',
  MANTENIMIENTO: '#f97316',
  CREDITOS: '#ec4899',
  OTROS: '#6b7280',
};
