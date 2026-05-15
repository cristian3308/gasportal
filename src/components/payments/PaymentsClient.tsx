'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CreatePaymentModal } from './CreatePaymentModal';
import { MarkPaidModal } from './MarkPaidModal';
import { useRouter } from 'next/navigation';

export function PaymentsClient({ initialPayments }: { initialPayments: any[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [paymentToPay, setPaymentToPay] = useState<any>(null);
  const router = useRouter();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'OVERDUE': return <AlertCircle className="text-red-500" size={16} />;
      default: return <Clock className="text-amber-500" size={16} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Pagado</Badge>;
      case 'OVERDUE': return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Vencido</Badge>;
      case 'PENDING': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendiente</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          {/* Aquí podrían ir los tabs de filtrado */}
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus size={18} className="mr-2" />
          Nuevo Pago
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white/50 shadow-sm border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock size={16} className="text-amber-500" /> Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(payments.filter(p => p.status === 'PENDING').reduce((acc, curr) => acc + Number(curr.amount), 0))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/50 shadow-sm border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> Pagados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(payments.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount), 0))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/50 shadow-sm border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" /> Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(payments.filter(p => p.status === 'OVERDUE').reduce((acc, curr) => acc + Number(curr.amount), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 border-b uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Concepto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Vencimiento</th>
                <th className="px-6 py-4">Monto</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No hay pagos registrados
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{payment.title}</p>
                      {payment.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{payment.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-xs">{payment.category}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-muted-foreground" />
                        {format(new Date(payment.dueDate), "d 'de' MMM, yyyy", { locale: es })}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatCurrency(Number(payment.amount))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(payment.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {payment.status !== 'PAID' && (
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700 h-8"
                          onClick={() => setPaymentToPay(payment)}
                        >
                          Pagar
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8">Detalles</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CreatePaymentModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={handleRefresh}
      />

      <MarkPaidModal 
        payment={paymentToPay}
        isOpen={!!paymentToPay}
        onClose={() => setPaymentToPay(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
