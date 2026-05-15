'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Fuel, 
  AlertTriangle, 
  Plus, 
  Droplets, 
  History,
  TrendingDown,
  Edit2,
  RefreshCw,
  Truck,
  DollarSign,
  Calendar,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/format-currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DeliveryModal } from './DeliveryModal';
import { NewSaleModal } from '../sales/NewSaleModal';
import { EditInventoryModal } from './EditInventoryModal';
import { FileText, Send } from 'lucide-react';
import { toast } from 'sonner';

export function InventoryClient() {
  const [data, setData] = useState<{ products: any[], tanks: any[] }>({ products: [], tanks: [] });
  const [salesData, setSalesData] = useState<{ sales: any[], summary: any }>({ sales: [], summary: { totalAmount: 0, totalGallons: 0 } });
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editType, setEditType] = useState<'PRODUCT' | 'TANK' | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [invRes, salesRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/sales')
      ]);
      const inv = await invRes.json();
      const sal = await salesRes.json();
      setData(inv);
      setSalesData(sal);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const sendFullSummary = async () => {
    setTestingTelegram(true);
    try {
      const res = await fetch('/api/reports/full-summary', { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        toast.success('Resumen enviado a Telegram.');
      } else {
        throw new Error(d.error || 'Error desconocido');
      }
    } catch (error: any) {
      toast.error('Error al enviar el resumen.');
    } finally {
      setTestingTelegram(false);
    }
  };



  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/reports/generate', { method: 'POST' });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      toast.success(`Reporte generado: ${d.fileName}. Revisa la carpeta de Archivos.`);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };


  const fetchInventory = fetchAll; // Alias for compatibility


  const openEdit = (item: any, type: 'PRODUCT' | 'TANK') => {
    setEditingItem(item);
    setEditType(type);
    setIsEditModalOpen(true);
  };


  useEffect(() => {
    fetchInventory();
  }, []);

  const products = data?.products || [];
  const tanks = data?.tanks || [];
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      <DeliveryModal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} onSuccess={fetchInventory} />
      <NewSaleModal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} onSuccess={fetchInventory} />
      <EditInventoryModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={fetchInventory} 
        item={editingItem}
        type={editType}
      />
      
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Control de Inventario</h1>
          <p className="text-zinc-500 mt-1">Gestión unificada de ventas (salidas) y viajes (entradas).</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={fetchAll} disabled={loading} className="bg-white">
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           </Button>

           <Button 
            variant="outline"
            onClick={sendFullSummary}
            disabled={testingTelegram}
            className="border-zinc-200 text-zinc-600 hover:text-zinc-900 gap-2"
           >
             {testingTelegram ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
             Resumen a Telegram
           </Button>

           <Button 
            variant="outline"
            onClick={generateReport}
            disabled={generatingReport}
            className="border-zinc-200 text-zinc-600 hover:text-zinc-900 gap-2"
           >
             {generatingReport ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
             Generar Reporte PDF
           </Button>
           
           <Button 
            onClick={() => setIsSaleModalOpen(true)}
            className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 gap-2"
           >
             <TrendingDown size={20} />
             Registrar Venta (Salida)
           </Button>

           <Button 
            onClick={() => setIsDeliveryModalOpen(true)}
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 gap-2"
           >
             <Truck size={20} />
             Registrar Viaje (Entrada)
           </Button>
        </div>
      </div>

      {/* Resumen Mensual */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-xl shadow-emerald-100/50 bg-gradient-to-br from-emerald-600 to-emerald-500 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-white/20 p-2 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">Ventas del Mes</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black">{formatCurrency(salesData.summary.totalAmount)}</h3>
              <p className="text-sm text-emerald-100 mt-1">Total recaudado en el mes actual</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-blue-100/50 bg-gradient-to-br from-blue-600 to-blue-500 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-white/20 p-2 rounded-xl">
                <Fuel className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Combustible Despachado</span>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-black">{salesData.summary.totalGallons.toLocaleString()} Gal</h3>
              <p className="text-sm text-blue-100 mt-1">Galones totales vendidos este mes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-zinc-100/50 bg-white border border-zinc-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="bg-zinc-100 p-2 rounded-xl">
                <Calendar className="w-6 h-6 text-zinc-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Periodo</span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-zinc-900 capitalize">{format(new Date(), 'MMMM yyyy', { locale: es })}</h3>
              <p className="text-sm text-zinc-500 mt-1">Resumen operativo actual</p>
            </div>
          </CardContent>
        </Card>
      </div>



      <Tabs defaultValue="tanks" className="space-y-6">
        <TabsList className="bg-zinc-100/80 p-1 backdrop-blur-sm border border-zinc-200">
          <TabsTrigger value="tanks" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Fuel size={16} />
            Combustible
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Droplets size={16} />
            Lubricantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tanks" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tanks.map((tank) => {
              const percentage = (tank.currentLevel / tank.capacity) * 100;
              const isLow = percentage < 20;

              return (
                <Card key={tank.id} className="border-none shadow-xl shadow-zinc-200/50 overflow-hidden group bg-white">
                  <CardHeader className="pb-4 border-b border-zinc-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-xl",
                          tank.fuelType === 'EXTRA' ? "bg-red-50" : 
                          tank.fuelType === 'DIESEL' ? "bg-zinc-800" : "bg-amber-50"
                        )}>
                          <Fuel size={20} className={cn(
                             tank.fuelType === 'EXTRA' ? "text-red-600" : 
                             tank.fuelType === 'DIESEL' ? "text-white" : "text-amber-600"
                          )} />
                        </div>
                        <CardTitle className="text-xl font-bold text-zinc-900">{tank.fuelType}</CardTitle>
                      </div>
                      <Badge variant={isLow ? 'destructive' : 'secondary'} className={cn(
                        "rounded-full px-3",
                        !isLow && "bg-emerald-50 text-emerald-700 border-emerald-100"
                      )}>
                        {isLow ? 'Nivel Crítico' : 'Nivel Óptimo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-6">
                    <div className="relative h-48 w-full flex items-end justify-center pb-4">
                        {/* Visualización del tanque */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <Fuel size={120} />
                        </div>
                        <div className="w-full h-full bg-zinc-50 rounded-2xl border-2 border-zinc-100 relative overflow-hidden flex flex-col justify-end">
                            <div 
                                className={cn(
                                    "w-full transition-all duration-1000 ease-in-out relative",
                                    tank.fuelType === 'EXTRA' ? "bg-gradient-to-t from-red-600 to-red-400" : 
                                    tank.fuelType === 'DIESEL' ? "bg-gradient-to-t from-zinc-700 to-zinc-500" : 
                                    "bg-gradient-to-t from-amber-500 to-amber-300"
                                )}
                                style={{ height: `${Math.max(percentage, 5)}%` }}
                            >
                                <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 animate-pulse" />
                            </div>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-3xl font-black text-zinc-900 leading-none">
                                {Math.round(percentage)}%
                            </span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">Capacidad Total</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Actual</span>
                            <p className="text-lg font-bold text-zinc-900">{tank.currentLevel.toLocaleString()}</p>
                            <span className="text-[10px] text-zinc-400 font-medium">Galones</span>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Capacidad</span>
                            <p className="text-lg font-bold text-zinc-900">{tank.capacity.toLocaleString()}</p>
                            <span className="text-[10px] text-zinc-400 font-medium">Galones</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-50 text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <RefreshCw size={10} />
                        Actualizado: {format(new Date(tank.lastReading), 'HH:mm', { locale: es })}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEdit(tank, 'TANK')}
                        className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1.5"
                      >
                        <Edit2 size={14} />
                        Ajustar Nivel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          {lowStockProducts.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-red-900 font-semibold text-sm">Alerta de Stock Bajo</h4>
                <p className="text-red-700 text-sm mt-1">
                  Hay {lowStockProducts.length} productos que necesitan reabastecimiento urgente.
                </p>
              </div>
            </div>
          )}

          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Precio Venta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-zinc-500">{product.brand || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={cn("font-bold", product.stock <= product.minStock ? "text-red-600" : "text-zinc-900")}>
                            {product.stock} {product.unit}s
                          </span>
                          <span className="text-[10px] text-zinc-400">Min: {product.minStock}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell>
                        {product.stock <= product.minStock ? (
                          <Badge className="bg-red-100 text-red-700 border-none hover:bg-red-100">Stock Bajo</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-100">Suficiente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => openEdit(product, 'PRODUCT')}
                        >
                          <Edit2 size={14} className="text-zinc-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
