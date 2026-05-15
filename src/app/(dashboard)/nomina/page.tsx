import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { PayrollClient } from '@/components/payroll/PayrollClient';

export default async function PayrollPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: {
      shifts: {
        take: 30,
        orderBy: { date: 'desc' }
      },
      payrolls: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return (
    <div className="p-8">
      <PayrollClient initialEmployees={employees} />
    </div>
  );
}
