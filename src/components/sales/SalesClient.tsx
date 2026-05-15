'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  Search, 
  Filter, 
  Download,
  DollarSign,
  Calendar,
  CreditCard,
  Banknote,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '@/lib/utils/format-currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { NewSaleModal } from './NewSaleModal';
import { Badge } from '@/components/ui/badge';

export function SalesClient() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      setSales(data.sales || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const totalSalesToday = sales
    .filter(s => {
      const today = new Date().toDateString();
      return new Date(s.createdAt).toDateString() === today;
    })
    .reduce((acc, s) => acc + s.amount, 0);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'EFECTIVO': return <Banknote className="w-4 h-4 text-emerald-500" />;
      case 'TARJETA': return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'TRANSFERENCIA': return <Send className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'COMBUSTIBLE': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Combustible</Badge>;
      case 'LUBRICANTES': return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Lubricantes</Badge>;
      case 'MINIMARKET': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Minimarket</Badge>;
      default: return <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200">Otro</Badge>;
    }
  };

  const filteredSales = sales.filter(s => 
    s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Registro de Ventas</h1>
          <p className="text-zinc-500 mt-1">Gestiona y monitorea los ingresos diarios de la estación.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-950 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200 gap-2"
        >
          <Plus size={20} />
          Nueva Venta
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-white/10 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-xs font-medium text-white/60">Hoy</span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-white/60">Ventas Totales</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalSalesToday)}</h3>
            </div>
          </CardContent>
        </Card>
        
        {/* Aquí podrías añadir más stats como % por método de pago */}
      </div>

      {/* Filters & Search */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 border-b border-zinc-100 flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Historial de Ventas</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar venta..."
                className="pl-9 w-[250px] bg-zinc-50 border-none h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter size={16} />
              Filtros
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Download size={16} />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow>
                <TableHead className="w-[180px]">Fecha y Hora</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-16 animate-pulse bg-zinc-50/50" />
                  </TableRow>
                ))
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                    No se encontraron registros de ventas.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-sm">{format(new Date(sale.createdAt), 'dd MMM, yyyy', { locale: es })}</span>
                        <span className="text-xs text-zinc-400">{format(new Date(sale.createdAt), 'HH:mm', { locale: es })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-zinc-900">
                      {formatCurrency(sale.amount)}
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(sale.category)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        {getPaymentIcon(sale.paymentMethod)}
                        <span className="capitalize">{sale.paymentMethod.toLowerCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600 border border-zinc-200">
                          {sale.createdBy.name.charAt(0)}
                        </div>
                        <span className="text-sm text-zinc-600">{sale.createdBy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm max-w-[200px] truncate">
                      {sale.description || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NewSaleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchSales}
      />
    </div>
  );
}
