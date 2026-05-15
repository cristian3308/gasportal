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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Loader2, Truck } from 'lucide-react';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliveryModal({ isOpen, onClose, onSuccess }: DeliveryModalProps) {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<{ products: any[], tanks: any[] }>({ products: [], tanks: [] });
  const [formData, setFormData] = useState({
    type: 'IN',
    fuelTankId: '',
    productId: '',
    quantity: '',
    description: '',
    target: 'FUEL' // FUEL or PRODUCT
  });

  useEffect(() => {
    if (isOpen) {
      fetch('/api/inventory').then(res => res.json()).then(setInventory);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fuelTankId: formData.target === 'FUEL' ? formData.fuelTankId : null,
          productId: formData.target === 'PRODUCT' ? formData.productId : null,
        }),
      });

      if (!res.ok) throw new Error('Error al registrar la entrada');

      toast.success('Entrada de inventario registrada con éxito');
      onSuccess();
      onClose();
      setFormData({
        type: 'IN',
        fuelTankId: '',
        productId: '',
        quantity: '',
        description: '',
        target: 'FUEL'
      });
    } catch (error) {
      toast.error('Ocurrió un error al registrar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="bg-blue-500/10 p-2 rounded-xl">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            Registrar Entrada (Viaje / Pedido)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500 uppercase">Tipo de Entrada</Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-lg">
                <button
                    type="button"
                    onClick={() => setFormData({...formData, target: 'FUEL'})}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${formData.target === 'FUEL' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                    Combustible
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({...formData, target: 'PRODUCT'})}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${formData.target === 'PRODUCT' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                    Lubricantes
                </button>
            </div>
          </div>

          {formData.target === 'FUEL' ? (
            <div className="space-y-2">
              <Label>Seleccionar Tanque</Label>
              <Select value={formData.fuelTankId} onValueChange={(v) => setFormData({ ...formData, fuelTankId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tanque" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.tanks.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.fuelType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Seleccionar Producto</Label>
              <Select value={formData.productId} onValueChange={(v) => setFormData({ ...formData, productId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Producto" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.brand})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Cantidad a Ingresar</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas / Descripción</Label>
            <Input
              placeholder="Ej: Camión de Texaco placa ABC-123"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Confirmar Ingreso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
