'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFolderSchema, CreateFolderInput } from '@/lib/validations/folder.schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentId?: string;
  folderToEdit?: any;
}

const COLORS = [
  { name: 'amber', value: 'bg-amber-500' },
  { name: 'blue', value: 'bg-blue-500' },
  { name: 'emerald', value: 'bg-emerald-500' },
  { name: 'rose', value: 'bg-rose-500' },
  { name: 'purple', value: 'bg-purple-500' },
  { name: 'zinc', value: 'bg-zinc-500' },
];

export function CreateFolderModal({ isOpen, onClose, onSuccess, parentId, folderToEdit }: CreateFolderModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!folderToEdit;

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<CreateFolderInput>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: folderToEdit?.name || '',
      description: folderToEdit?.description || '',
      color: folderToEdit?.color || 'amber',
      parentId: parentId || undefined,
    }
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: CreateFolderInput) => {
    setLoading(true);
    try {
      const url = isEditing ? `/api/folders/${folderToEdit.id}` : '/api/folders';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al procesar la carpeta');
      }

      toast.success(isEditing ? 'Carpeta actualizada' : 'Carpeta creada exitosamente');
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Carpeta' : 'Nueva Carpeta'}</DialogTitle>
          <DialogDescription>
            Organiza tus documentos y pagos en carpetas personalizadas.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la carpeta <span className="text-red-500">*</span></Label>
            <Input id="name" {...register('name')} placeholder="Ej: Facturas 2026" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea 
              id="description" 
              {...register('description')} 
              placeholder="Archivos relacionados con contabilidad..."
              className="resize-none" 
              rows={3} 
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="space-y-3 pt-2">
            <Label>Color de la carpeta</Label>
            <div className="flex gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setValue('color', c.name)}
                  className={`w-8 h-8 rounded-full ${c.value} transition-all ${
                    selectedColor === c.name ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={loading}>
              {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Carpeta')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
