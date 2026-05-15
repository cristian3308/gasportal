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
import { toast } from 'sonner';
import { Loader2, Settings2 } from 'lucide-react';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: any;
  type: 'PRODUCT' | 'TANK' | null;
}

export function EditInventoryModal({ isOpen, onClose, onSuccess, item, type }: EditInventoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          type,
          ...formData
        }),
      });

      if (!res.ok) throw new Error('Error al actualizar');

      toast.success('Actualizado correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Ocurrió un error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-zinc-500" />
            {type === 'TANK' ? `Editar Tanque: ${item.fuelType}` : `Editar Producto: ${item.name}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {type === 'TANK' ? (
            <>
              <div className="space-y-2">
                <Label>Nombre del Combustible</Label>
                <Input
                  value={formData.fuelType || ''}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Nivel Actual (Gal)</Label>
                    <Input
                    type="number"
                    value={formData.currentLevel || 0}
                    onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Capacidad Total (Gal)</Label>
                    <Input
                    type="number"
                    value={formData.capacity || 0}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nombre del Producto</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Precio (COP)</Label>
                    <Input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Stock Actual</Label>
                    <Input
                    type="number"
                    value={formData.stock || 0}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stock Mínimo (Alerta)</Label>
                <Input
                  type="number"
                  value={formData.minStock || 0}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                />
              </div>
            </>
          )}

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-zinc-900 text-white" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
