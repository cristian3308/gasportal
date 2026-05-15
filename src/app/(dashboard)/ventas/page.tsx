import { Metadata } from 'next';
import { SalesClient } from '@/components/sales/SalesClient';

export const metadata: Metadata = {
  title: 'Ventas | GasPortal',
  description: 'Registro de ventas diarias de la estación.',
};

export default function SalesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <SalesClient />
    </div>
  );
}
