// app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, addDays } from 'date-fns';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const in7Days = addDays(now, 7);

  const [
    totalFiles,
    filesThisMonth,
    pendingPayments,
    overduePayments,
    upcomingPayments,
    totalStorageResult,
    recentFiles,
    expensesByCategory,
    monthlyExpenses,
  ] = await Promise.all([
    prisma.file.count({ where: { isDeleted: false } }),
    prisma.file.count({ where: { isDeleted: false, createdAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.payment.count({ where: { status: 'PENDING', dueDate: { gte: now } } }),
    prisma.payment.count({ where: { status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { lt: now } } }),
    prisma.payment.findMany({
      where: { status: 'PENDING', dueDate: { gte: now, lte: in7Days } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    prisma.file.aggregate({
      _sum: { fileSize: true },
      where: { isDeleted: false },
    }),
    prisma.file.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        folder: { select: { name: true, color: true } },
        uploadedBy: { select: { name: true } },
      },
    }),
    // Gastos por categoría (Pagados y Pendientes)
    prisma.payment.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: { status: { not: 'CANCELLED' } },
    }),
    // Resumen mensual (últimos 6 meses)
    prisma.$queryRaw`
      SELECT 
        TO_CHAR(due_date, 'YYYY-MM') as month,
        SUM(amount) as total
      FROM payments
      WHERE status != 'CANCELLED'
      AND due_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    ` as Promise<any[]>,
  ]);

  const totalStorageBytes = Number(totalStorageResult._sum.fileSize ?? 0);

  return NextResponse.json({
    stats: {
      totalFiles,
      filesThisMonth,
      pendingPayments,
      overduePayments,
      totalStorageBytes,
      totalStorageGB: (totalStorageBytes / 1_073_741_824).toFixed(2),
    },
    upcomingPayments: upcomingPayments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
    recentFiles: recentFiles.map((f) => ({
      ...f,
      fileSize: Number(f.fileSize),
    })),
    expensesByCategory: expensesByCategory.map(item => ({
      category: item.category,
      total: Number(item._sum.amount || 0)
    })),
    monthlyExpenses: monthlyExpenses.map(item => ({
      month: item.month,
      total: Number(item.total)
    })),
  });
}
