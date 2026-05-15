import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PaymentsClient } from '@/components/payments/PaymentsClient';

export const metadata = {
  title: 'Pagos y Obligaciones | GasPortal',
};

export default async function PagosPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Cargar pagos de la base de datos
  const payments = await prisma.payment.findMany({
    orderBy: [
      { status: 'asc' }, // PENDING primero (asumiendo orden alfabetico o enum order)
      { dueDate: 'asc' }
    ],
    include: {
      createdBy: {
        select: { name: true, email: true }
      }
    }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pagos y Obligaciones</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los pagos recurrentes, impuestos, nómina y obligaciones del portal.
        </p>
      </div>

      <PaymentsClient initialPayments={JSON.parse(JSON.stringify(payments))} />
    </div>
  );
}
