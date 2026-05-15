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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Loader2, DollarSign } from 'lucide-react';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewSaleModal({ isOpen, onClose, onSuccess }: NewSaleModalProps) {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<{ products: any[], tanks: any[] }>({ products: [], tanks: [] });
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'EFECTIVO',
    category: 'COMBUSTIBLE',
    description: '',
    fuelTankId: '',
    fuelQuantity: '',
    productId: '',
    productQty: '1',
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
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error al registrar la venta');

      toast.success('Venta registrada e inventario actualizado');
      onSuccess();
      onClose();
      setFormData({
        amount: '',
        paymentMethod: 'EFECTIVO',
        category: 'COMBUSTIBLE',
        description: '',
        fuelTankId: '',
        fuelQuantity: '',
        productId: '',
        productQty: '1',
      });
    } catch (error) {
      toast.error('Ocurrió un error al registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <div className="bg-green-500/10 p-2 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            Registrar Venta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Categoría</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v, fuelTankId: '', productId: '' })}
              >
                <SelectTrigger className="h-12 bg-zinc-50 border-zinc-200">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMBUSTIBLE">⛽ Combustible</SelectItem>
                  <SelectItem value="LUBRICANTES">🛢️ Lubricantes</SelectItem>
                  <SelectItem value="MINIMARKET">🛒 Minimarket</SelectItem>
                  <SelectItem value="OTROS">📦 Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Monto Total (COP)</Label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-zinc-400 font-bold">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="pl-7 h-12 bg-zinc-50 border-zinc-200 text-lg font-bold"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Selección específica según categoría */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-4">
            {formData.category === 'COMBUSTIBLE' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-600 uppercase">Tanque / Tipo</Label>
                  <Select 
                    value={formData.fuelTankId} 
                    onValueChange={(v) => setFormData({ ...formData, fuelTankId: v })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar tanque" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.tanks.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.fuelType} (Disp: {t.currentLevel} Gal)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-600 uppercase">Galones Vendidos</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    className="bg-white"
                    required={formData.category === 'COMBUSTIBLE'}
                    value={formData.fuelQuantity}
                    onChange={(e) => setFormData({ ...formData, fuelQuantity: e.target.value })}
                  />
                </div>
              </>
            )}

            {formData.category === 'LUBRICANTES' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-600 uppercase">Producto</Label>
                  <Select 
                    value={formData.productId} 
                    onValueChange={(v) => setFormData({ ...formData, productId: v })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar lubricante" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory.products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.brand}) - Stock: {p.stock}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-600 uppercase">Cantidad (Unidades)</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    className="bg-white"
                    required={formData.category === 'LUBRICANTES'}
                    value={formData.productQty}
                    onChange={(e) => setFormData({ ...formData, productQty: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Método de Pago</Label>
            <Select 
              value={formData.paymentMethod} 
              onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
            >
              <SelectTrigger className="h-12 bg-zinc-50 border-zinc-200">
                <SelectValue placeholder="Seleccionar método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO">💵 Efectivo</SelectItem>
                <SelectItem value="TARJETA">💳 Tarjeta</SelectItem>
                <SelectItem value="TRANSFERENCIA">📱 Transferencia / Nequi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full h-12 bg-zinc-950 hover:bg-zinc-800 text-white text-lg font-bold shadow-xl shadow-zinc-200" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Confirmar Registro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

