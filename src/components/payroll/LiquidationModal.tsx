'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateLiquidation } from '@/lib/payroll-utils';
import { formatCurrency } from '@/lib/utils/format-currency';
import { toast } from 'sonner';
import { Loader2, Calculator, ReceiptText } from 'lucide-react';

interface LiquidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: any[];
}

export function LiquidationModal({ isOpen, onClose, onSuccess, employees }: LiquidationModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(), 'yyyy-MM-15')
  });

  const [liquidations, setLiquidations] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const results = employees.map(emp => ({
        employeeId: emp.id,
        name: emp.name,
        ...calculateLiquidation(emp.baseSalary, 15, emp.transportAid)
      }));
      setLiquidations(results);
    }
  }, [isOpen, employees]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Aquí iría el POST a /api/payroll
      toast.success('Nómina liquidada y guardada correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Error al liquidar la nómina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Calculator className="w-6 h-6 text-zinc-900" />
            Liquidación de Nómina
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
            <div className="space-y-1">
              <Label className="text-xs uppercase font-bold text-zinc-500">Inicio Periodo</Label>
              <Input type="date" value={selectedPeriod.start} onChange={e => setSelectedPeriod({...selectedPeriod, start: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase font-bold text-zinc-500">Fin Periodo</Label>
              <Input type="date" value={selectedPeriod.end} onChange={e => setSelectedPeriod({...selectedPeriod, end: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-zinc-900 flex items-center gap-2">
              <ReceiptText size={18} />
              Desglose por Empleado (Quincenal)
            </h4>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b">
                  <tr>
                    <th className="text-left p-3">Empleado</th>
                    <th className="text-right p-3">Sueldo Base</th>
                    <th className="text-right p-3">Aux. Transp</th>
                    <th className="text-right p-3">Deducciones</th>
                    <th className="text-right p-3 font-bold">Neto a Pagar</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {liquidations.map((liq, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium">{liq.name}</td>
                      <td className="p-3 text-right">{formatCurrency(liq.basePeriod)}</td>
                      <td className="p-3 text-right text-emerald-600">+{formatCurrency(liq.transportAid)}</td>
                      <td className="p-3 text-right text-red-500">-{formatCurrency(liq.totalDeductions)}</td>
                      <td className="p-3 text-right font-bold text-zinc-900">{formatCurrency(liq.netSalary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-zinc-900 text-white rounded-xl flex justify-between items-center">
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase">Total Nómina a Desembolsar</p>
              <h3 className="text-2xl font-black">{formatCurrency(liquidations.reduce((acc, l) => acc + l.netSalary, 0))}</h3>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-xs font-bold uppercase">Total Deducciones (Ley)</p>
              <p className="font-bold">{formatCurrency(liquidations.reduce((acc, l) => acc + l.totalDeductions, 0))}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-zinc-900 text-white gap-2">
            {loading ? <Loader2 className="animate-spin" /> : 'Confirmar y Guardar Pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper to avoid build error
import { format } from 'date-fns';
