'use client';

import { formatBytes } from '@/lib/utils/format-bytes';
import { Download, File, FileText, Image as ImageIcon, FileSpreadsheet, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileListProps {
  files: any[];
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('image')) return <ImageIcon className="text-blue-500" />;
  if (mimeType.includes('pdf')) return <FileText className="text-red-500" />;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet className="text-emerald-500" />;
  return <File className="text-zinc-500" />;
};

export function FileList({ files, onDelete, onRefresh }: FileListProps) {
  const handleDownload = async (file: any) => {
    try {
      const res = await fetch(`/api/files/${file.id}`);
      if (!res.ok) throw new Error('No se pudo obtener el archivo');
      const data = await res.json();
      
      // Abrir URL de descarga (o forzar descarga en el cliente)
      window.open(data.downloadUrl, '_blank');
      onRefresh?.();
    } catch (error) {
      toast.error('Error al descargar el archivo');
    }
  };

  if (!files?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
        <File size={48} className="mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-lg font-medium text-foreground">Carpeta vacía</p>
        <p className="text-sm">Arrastra archivos aquí para subirlos a Digital Ocean.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 border-b uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4 hidden md:table-cell">Tamaño</th>
              <th className="px-6 py-4 hidden sm:table-cell">Subido por</th>
              <th className="px-6 py-4 hidden lg:table-cell">Fecha</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-muted/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-lg border shadow-sm">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground max-w-[200px] sm:max-w-[300px] truncate" title={file.name}>
                        {file.name}
                      </p>
                      {file.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {file.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground md:hidden mt-1">{formatBytes(file.fileSize)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 hidden md:table-cell whitespace-nowrap">
                  {formatBytes(file.fileSize)}
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                    {file.uploadedBy?.name || 'Usuario'}
                  </span>
                </td>
                <td className="px-6 py-4 hidden lg:table-cell text-muted-foreground whitespace-nowrap">
                  {new Date(file.createdAt).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDownload(file)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-100 hover:text-amber-700"
                      title="Descargar"
                    >
                      <Download size={18} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors outline-none focus:ring-2 focus:ring-amber-500">
                        <MoreVertical size={18} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(file)} className="cursor-pointer">
                          <Download size={16} className="mr-2" /> Descargar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(file.id)} 
                          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
                        >
                          <Trash2 size={16} className="mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
