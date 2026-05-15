'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, AlertCircle, CalendarDays, HardDrive, ArrowRight } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format-bytes';
import { formatCurrency } from '@/lib/utils/format-currency';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import Link from 'next/link';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Error al cargar métricas');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="h-20 w-1/3 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
        </div>
        <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const { stats, upcomingPayments, recentFiles, expensesByCategory, monthlyExpenses } = data || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground mt-2">
            Resumen de operaciones y estado financiero de la estación.
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-muted-foreground">Fecha actual</p>
          <p className="text-lg font-bold">{new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Tarjetas de métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ... (mantenemos las tarjetas existentes pero con mejor diseño si es necesario) ... */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Archivos</CardTitle>
            <FolderOpen className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFiles || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats?.filesThisMonth || 0} subidos este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <CalendarDays className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingPayments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Programados a futuro
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm bg-red-50/30 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-red-700">Pagos Vencidos</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.overduePayments || 0}</div>
            <p className="text-xs text-red-600/80 mt-1 font-medium">
              Requiere atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Almacenamiento (DO Spaces)</CardTitle>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStorageGB || '0.00'} GB</div>
            <div className="mt-2 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all" 
                style={{ width: `${Math.min((Number(stats?.totalStorageGB) / 250) * 100, 100)}%` }} 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalStorageGB}GB de 250 GB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Analytics */}
      <DashboardCharts 
        expensesByCategory={expensesByCategory || []} 
        monthlyExpenses={monthlyExpenses || []} 
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximos Pagos */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Próximos Pagos</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Los próximos 7 días</p>
            </div>
            <Link href="/pagos" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
              Ver todos <ArrowRight size={16} />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingPayments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No hay pagos programados para los próximos días.
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingPayments?.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-transparent hover:border-border transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-500/10 p-2 rounded-lg">
                        <CalendarDays size={18} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{payment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Vence: {new Date(payment.dueDate).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(payment.amount)}</p>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        Pendiente
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Archivos Recientes */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Archivos Recientes</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Últimos documentos subidos</p>
            </div>
            <Link href="/archivos" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
              Ver todos <ArrowRight size={16} />
            </Link>
          </CardHeader>
          <CardContent>
            {recentFiles?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                Aún no hay archivos subidos.
              </div>
            ) : (
              <div className="space-y-4">
                {recentFiles?.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-transparent hover:border-border transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-blue-500/10 p-2 rounded-lg">
                        <FolderOpen size={18} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          En {file.folder?.name || 'Raíz'} · {formatBytes(file.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-medium text-muted-foreground">
                        {new Date(file.createdAt).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
