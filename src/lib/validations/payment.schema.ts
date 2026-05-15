// lib/validations/payment.schema.ts
import { z } from 'zod';

export const createPaymentSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(200),
  description: z.string().optional(),
  amount: z.number().positive('El monto debe ser positivo'),
  category: z.enum([
    'ARRIENDO', 'IMPUESTOS', 'NOMINA', 'PROVEEDORES',
    'SERVICIOS', 'SEGUROS', 'MANTENIMIENTO', 'CREDITOS', 'OTROS',
  ]),
  dueDate: z.string().min(1, 'La fecha de vencimiento es requerida'),
  recurrence: z.enum([
    'NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY',
    'BIMONTHLY', 'QUARTERLY', 'ANNUALLY',
  ]).default('NONE'),
  alertDays: z.number().int().min(0).max(30).default(5),
  notes: z.string().optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial();

export const markPaidSchema = z.object({
  paidAmount: z.number().positive('El monto pagado debe ser positivo'),
  proofFileId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;

export const RECURRENCE_LABELS: Record<string, string> = {
  NONE: 'Sin recurrencia',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  BIMONTHLY: 'Bimensual',
  QUARTERLY: 'Trimestral',
  ANNUALLY: 'Anual',
};
