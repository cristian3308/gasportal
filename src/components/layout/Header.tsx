'use client';

import { Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GlobalSearch } from './GlobalSearch';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex-1 flex items-center gap-4">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-background"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium">{session?.user?.name || 'Usuario'}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {session?.user?.role?.toLowerCase() || 'Empleado'}
            </span>
          </div>
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={session?.user?.avatarUrl || ''} />
            <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
