'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, X, CheckCircle, Paperclip } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';

interface MarkPaidModalProps {
  payment: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MarkPaidModal({ payment, isOpen, onClose, onSuccess }: MarkPaidModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [proofFile, setProofFile] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    paidAmount: payment?.amount?.toString() || '',
    notes: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    // No enviamos folderId para que quede en la raíz o use el default del backend

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al subir comprobante');
      const data = await res.json();
      setProofFile({ id: data.file.id, name: data.file.name });
      toast.success('Comprobante subido correctamente');
    } catch (error) {
      toast.error('Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    
    setIsLoading(true);

    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markPaid: true,
          paidAmount: Number(formData.paidAmount),
          proofFileId: proofFile?.id,
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al marcar como pagado');
      }

      toast.success('Pago registrado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Ocurrió un error al procesar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Marcar como Pagado</DialogTitle>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-lg mb-4 space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Concepto</p>
          <p className="text-lg font-bold">{payment.title}</p>
          <p className="text-amber-600 font-semibold">{formatCurrency(payment.amount)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paidAmount">Monto Pagado (COP)</Label>
            <Input 
              id="paidAmount" 
              type="number" 
              required 
              value={formData.paidAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Comprobante de Pago (Opcional)</Label>
            {!proofFile ? (
              <div className="relative">
                <Input 
                  type="file" 
                  className="hidden" 
                  id="proof-upload"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label 
                  htmlFor="proof-upload"
                  className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  {isUploading ? (
                    <span className="text-sm">Subiendo...</span>
                  ) : (
                    <>
                      <Upload size={18} className="text-muted-foreground" />
                      <span className="text-sm font-medium">Subir comprobante (PDF/Img)</span>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700 truncate max-w-[250px]">
                    {proofFile.name}
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setProofFile(null)}
                  className="text-emerald-600 hover:text-emerald-800"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Internas (Opcional)</Label>
            <Textarea 
              id="notes" 
              placeholder="Ej: Pagado mediante transferencia Bancolombia..." 
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isUploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isUploading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
