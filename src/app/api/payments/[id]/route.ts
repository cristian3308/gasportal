// app/api/payments/[id]/route.ts — Operaciones sobre pago individual
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updatePaymentSchema, markPaidSchema } from '@/lib/validations/payment.schema';

// GET /api/payments/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      proofFile: true,
    },
  });

  if (!payment) {
    return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    payment: {
      ...payment,
      amount: Number(payment.amount),
      paidAmount: payment.paidAmount ? Number(payment.paidAmount) : null,
    },
  });
}

// PATCH /api/payments/:id — Actualizar pago o marcar como pagado
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Si viene el campo "markPaid", es una operación de marcar como pagado
  if (body.markPaid) {
    const result = markPaidSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paidAmount: result.data.paidAmount,
        proofFileId: result.data.proofFileId,
        notes: result.data.notes || undefined,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'mark_payment_paid',
        entityType: 'payment',
        entityId: id,
        metadata: { title: payment.title, paidAmount: Number(payment.paidAmount) },
      },
    });

    return NextResponse.json({
      payment: {
        ...payment,
        amount: Number(payment.amount),
        paidAmount: Number(payment.paidAmount),
      },
    });
  }

  // Actualización general
  const result = updatePaymentSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const updateData: any = { ...result.data };
  if (updateData.dueDate) {
    updateData.dueDate = new Date(updateData.dueDate);
  }

  const payment = await prisma.payment.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    payment: {
      ...payment,
      amount: Number(payment.amount),
      paidAmount: payment.paidAmount ? Number(payment.paidAmount) : null,
    },
  });
}

// DELETE /api/payments/:id — Cancelar pago
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const payment = await prisma.payment.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'cancel_payment',
      entityType: 'payment',
      entityId: id,
      metadata: { title: payment.title },
    },
  });

  return NextResponse.json({ message: 'Pago cancelado' });
}
