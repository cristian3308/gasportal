// app/api/payments/route.ts — CRUD de pagos
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPaymentSchema } from '@/lib/validations/payment.schema';
import { startOfDay } from 'date-fns';

// GET /api/payments — Listar pagos con filtros
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');     // formato: "2026-05"
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  const where: any = { status: { not: 'CANCELLED' } };

  if (month) {
    const [year, m] = month.split('-').map(Number);
    where.dueDate = {
      gte: new Date(year, m - 1, 1),
      lte: new Date(year, m, 0),
    };
  }

  if (status) where.status = status;
  if (category) where.category = category;

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { dueDate: 'asc' },
    include: {
      createdBy: { select: { name: true } },
      proofFile: { select: { id: true, name: true, storageKey: true } },
    },
  });

  // Calcular urgencia para cada pago
  const today = startOfDay(new Date());
  const paymentsWithUrgency = payments.map((p) => {
    const daysUntilDue = Math.ceil(
      (p.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      ...p,
      amount: Number(p.amount),
      paidAmount: p.paidAmount ? Number(p.paidAmount) : null,
      daysUntilDue,
      urgency:
        p.status === 'PAID' ? 'paid'
        : daysUntilDue < 0 ? 'overdue'
        : daysUntilDue <= 2 ? 'critical'
        : daysUntilDue <= 5 ? 'warning'
        : 'ok',
    };
  });

  return NextResponse.json({ payments: paymentsWithUrgency });
}

// POST /api/payments — Crear nuevo pago
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const result = createPaymentSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      title: result.data.title,
      description: result.data.description,
      amount: result.data.amount,
      category: result.data.category,
      dueDate: new Date(result.data.dueDate),
      recurrence: result.data.recurrence,
      alertDays: result.data.alertDays,
      notes: result.data.notes,
      createdById: session.user.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'create_payment',
      entityType: 'payment',
      entityId: payment.id,
      metadata: { title: payment.title, amount: Number(payment.amount) },
    },
  });

  return NextResponse.json({ payment: { ...payment, amount: Number(payment.amount) } }, { status: 201 });
}
