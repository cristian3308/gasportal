import { Metadata } from 'next';
import { InventoryClient } from '@/components/inventory/InventoryClient';

export const metadata: Metadata = {
  title: 'Inventario | GasPortal',
  description: 'Control de stock de lubricantes y niveles de combustible.',
};

export default function InventoryPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <InventoryClient />
    </div>
  );
}
