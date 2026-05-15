'use client';

import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  CalendarDays, 
  Settings,
  Wallet,
  Fuel, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import NextLink from 'next/link';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventario', href: '/inventario', icon: Package },
  { name: 'Nómina', href: '/nomina', icon: Wallet },
  { name: 'Archivos', href: '/archivos', icon: FolderOpen },
  { name: 'Pagos y Obligaciones', href: '/pagos', icon: CalendarDays },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-zinc-950 text-zinc-300 border-r border-zinc-900 transition-all duration-300">
      <div className="flex h-16 shrink-0 items-center px-6 gap-3 border-b border-zinc-900 bg-zinc-950/50">
        <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
          <Fuel size={24} className="text-amber-500" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">GasPortal</span>
      </div>

      <nav className="flex flex-1 flex-col px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <NextLink
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'hover:bg-zinc-900 hover:text-white'
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  'shrink-0 transition-colors',
                  isActive ? 'text-amber-500' : 'text-zinc-500 group-hover:text-zinc-300'
                )}
              />
              {item.name}
            </NextLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-900">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-zinc-900"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
