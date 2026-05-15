'use client';

import { Folder as FolderIcon, MoreVertical, Trash2, Edit2, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface FolderGridProps {
  folders: any[];
  onDelete?: (id: string) => void;
  onEdit?: (folder: any) => void;
}

export function FolderGrid({ folders, onDelete, onEdit }: FolderGridProps) {
  if (!folders?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
        <FolderIcon size={48} className="mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-lg font-medium text-foreground">No hay carpetas</p>
        <p className="text-sm">Crea una carpeta para empezar a organizar los documentos.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {folders.map((folder) => (
        <Card key={folder.id} className="group hover:shadow-md transition-all duration-200 border-muted relative">
          <CardContent className="p-0">
            <Link href={`/archivos/${folder.id}`} className="block p-5">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg bg-${folder.color}-500/10 text-${folder.color}-500`}>
                  <FolderIcon size={28} className="fill-current opacity-80" />
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold text-lg truncate group-hover:text-amber-600 transition-colors pr-8">
                  {folder.name}
                </h3>
                {folder.description && (
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {folder.description}
                  </p>
                )}
              </div>
              
              <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileText size={14} />
                  <span>{folder._count?.files || 0} archivos</span>
                </div>
              </div>
            </Link>
            
            {/* Acciones movidas fuera del Link para evitar error de hidratación (button inside a) */}
            <div className="absolute top-5 right-5 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors outline-none focus:ring-2 focus:ring-amber-500 bg-card shadow-sm border border-transparent hover:border-border">
                  <MoreVertical size={18} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEdit?.(folder)} className="cursor-pointer">
                    <Edit2 size={16} className="mr-2" /> Editar
                  </DropdownMenuItem>
                  {!folder.isDefault && (
                    <DropdownMenuItem onClick={() => onDelete?.(folder.id)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
                      <Trash2 size={16} className="mr-2" /> Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
