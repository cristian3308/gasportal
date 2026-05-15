'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Copy, Plus, Trash2, ShieldCheck, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfigPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  // Fetch códigos de invitación
  const { data: codesData, isLoading: loadingCodes } = useQuery({
    queryKey: ['invitation-codes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/codes');
      if (!res.ok) throw new Error('Error al cargar códigos');
      return res.json();
    },
    enabled: isAdmin,
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'EMPLOYEE' }),
      });
      if (!res.ok) throw new Error('Error al generar código');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Código de invitación generado');
      queryClient.invalidateQueries({ queryKey: ['invitation-codes'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Administra tu cuenta y las invitaciones al portal.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Sección de Perfil (Para todos) */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserCircle className="w-5 h-5 text-amber-500" />
              <div>
                <CardTitle>Mi Perfil</CardTitle>
                <CardDescription>Información básica de tu cuenta.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Nombre Completo</Label>
              <Input value={session?.user?.name || ''} disabled className="bg-muted/50" />
            </div>
            <div className="grid gap-2">
              <Label>Correo Electrónico</Label>
              <Input value={session?.user?.email || ''} disabled className="bg-muted/50" />
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm">Cambiar Contraseña</Button>
            </div>
          </CardContent>
        </Card>

        {/* Sección de Administración (Solo Admin) */}
        {isAdmin && (
          <Card className="shadow-sm border-amber-200 bg-amber-50/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <div>
                  <CardTitle>Gestión de Invitaciones</CardTitle>
                  <CardDescription>Genera códigos para que otros empleados se registren.</CardDescription>
                </div>
              </div>
              <Button onClick={() => generateCodeMutation.mutate()} disabled={generateCodeMutation.isPending} className="bg-amber-600 hover:bg-amber-700">
                <Plus size={18} className="mr-2" />
                Generar Código
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-background overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-xs font-medium border-b uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Rol</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loadingCodes ? (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Cargando códigos...</td></tr>
                    ) : codesData?.codes?.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No hay códigos generados.</td></tr>
                    ) : (
                      codesData?.codes?.map((c: any) => (
                        <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-amber-700">{c.code}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{c.role}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {c.isUsed ? (
                              <div className="flex flex-col">
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none w-fit">Usado</Badge>
                                <span className="text-[10px] text-muted-foreground mt-1">{c.usedBy?.name}</span>
                              </div>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none w-fit">Disponible</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => copyToClipboard(c.code)}
                              title="Copiar Código"
                            >
                              <Copy size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
