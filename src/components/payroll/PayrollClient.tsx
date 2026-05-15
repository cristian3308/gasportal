'use client';

import { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Wallet, 
  Plus, 
  UserPlus, 
  FileCheck,
  ChevronRight,
  DollarSign,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/format-currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { NewEmployeeModal } from './NewEmployeeModal';
import { LiquidationModal } from './LiquidationModal';

interface PayrollClientProps {
  initialEmployees: any[];
}

export function PayrollClient({ initialEmployees }: PayrollClientProps) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [isNewEmployeeOpen, setIsNewEmployeeOpen] = useState(false);
  const [isLiquidationOpen, setIsLiquidationOpen] = useState(false);

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    const data = await res.json();
    setEmployees(data);
  };


  return (
    <div className="space-y-6">
      <NewEmployeeModal 
        isOpen={isNewEmployeeOpen} 
        onClose={() => setIsNewEmployeeOpen(false)} 
        onSuccess={fetchEmployees} 
      />
      <LiquidationModal 
        isOpen={isLiquidationOpen} 
        onClose={() => setIsLiquidationOpen(false)} 
        onSuccess={fetchEmployees}
        employees={employees}
      />
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Gestión de Nómina</h1>
          <p className="text-zinc-500 mt-1">Control de asistencia, liquidaciones quincenales y pagos.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="gap-2 bg-white border-zinc-200" onClick={() => setIsNewEmployeeOpen(true)}>
             <UserPlus size={18} />
             Nuevo Empleado
           </Button>
           <Button className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200 gap-2" onClick={() => setIsLiquidationOpen(true)}>
             <FileCheck size={18} />
             Liquidar Quincena
           </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Empleados Activos</p>
                <h3 className="text-2xl font-bold text-zinc-900">{employees.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-xl">
                <Wallet className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Próxima Nómina (Est.)</p>
                <h3 className="text-2xl font-bold text-zinc-900">{formatCurrency(employees.reduce((acc, e) => acc + (e.baseSalary / 2), 0))}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">Periodo Actual</p>
                <h3 className="text-lg font-bold text-zinc-900">16 - 31 Mayo 2026</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Planilla de Trabajadores</CardTitle>
          <CardDescription>Resumen de asistencia y salarios base para el periodo actual.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Salario Base (Mes)</TableHead>
                <TableHead>Asistencia (Días)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                    No hay empleados registrados todavía.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600 border border-zinc-200">
                          {employee.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900">{employee.name}</span>
                          <span className="text-xs text-zinc-500">CC {employee.documentId}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200">
                        {employee.position}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-zinc-700">
                      {formatCurrency(employee.baseSalary)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-zinc-400" />
                        <span className="text-sm font-bold text-zinc-900">15/15</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-100">
                        Al día
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="hover:bg-zinc-100 gap-2">
                        Ver Detalle
                        <ChevronRight size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
