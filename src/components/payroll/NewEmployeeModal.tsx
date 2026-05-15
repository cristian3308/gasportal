'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewEmployeeModal({ isOpen, onClose, onSuccess }: NewEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    documentId: '',
    baseSalary: '',
    position: 'Islero',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error al crear empleado');

      toast.success('Empleado registrado con éxito');
      onSuccess();
      onClose();
      setFormData({ name: '', documentId: '', baseSalary: '', position: 'Islero' });
    } catch (error) {
      toast.error('Ocurrió un error al registrar el empleado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <UserPlus className="w-5 h-5 text-zinc-900" />
            Registrar Nuevo Empleado
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input
              required
              placeholder="Ej: Juan Pérez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Documento de Identidad (CC)</Label>
            <Input
              required
              placeholder="Ej: 123456789"
              value={formData.documentId}
              onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Salario Mensual Base (COP)</Label>
            <Input
              type="number"
              required
              placeholder="1300000"
              value={formData.baseSalary}
              onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-zinc-900 text-white" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Registrar Empleado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
