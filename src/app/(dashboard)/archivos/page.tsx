'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderGrid } from '@/components/files/FolderGrid';
import { FileList } from '@/components/files/FileList';
import { CreateFolderModal } from '@/components/files/CreateFolderModal';
import { toast } from 'sonner';

export default function ArchivosPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<any>(null);
  const [search, setSearch] = useState('');

  // Fetch Carpetas
  const { data: foldersData, isLoading: isLoadingFolders } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const res = await fetch('/api/folders');
      if (!res.ok) throw new Error('Error cargando carpetas');
      return res.json();
    }
  });

  // Fetch Archivos sueltos (root)
  const { data: filesData, isLoading: isLoadingFiles } = useQuery({
    queryKey: ['files', search],
    queryFn: async () => {
      const url = new URL('/api/files', window.location.origin);
      if (search) url.searchParams.set('search', search);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Error cargando archivos');
      return res.json();
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Carpeta eliminada');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: (error: any) => toast.error(error.message)
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Archivo eliminado');
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: any) => toast.error(error.message)
  });

  const handleEditFolder = (folder: any) => {
    setFolderToEdit(folder);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setFolderToEdit(null), 300); // Esperar animación de cierre
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Archivos</h1>
          <p className="text-muted-foreground mt-2">
            Organiza facturas, recibos y documentos importantes.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar archivos..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
            <FolderPlus className="w-4 h-4 mr-2" />
            Nueva Carpeta
          </Button>
        </div>
      </div>

      {!search && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Carpetas</h2>
          {isLoadingFolders ? (
            <div className="h-32 bg-muted/50 animate-pulse rounded-xl" />
          ) : (
            <FolderGrid 
              folders={foldersData?.folders} 
              onDelete={(id) => {
                if(confirm('¿Estás seguro de eliminar esta carpeta y todo su contenido?')) {
                  deleteFolderMutation.mutate(id);
                }
              }}
              onEdit={handleEditFolder}
            />
          )}
        </section>
      )}

      <section className="space-y-4 pt-4">
        <h2 className="text-xl font-semibold tracking-tight">
          {search ? 'Resultados de búsqueda' : 'Todos los Archivos'}
        </h2>
        {isLoadingFiles ? (
            <div className="h-64 bg-muted/50 animate-pulse rounded-xl" />
          ) : (
            <FileList 
              files={filesData?.files} 
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['files'] })}
              onDelete={(id) => {
                if(confirm('¿Estás seguro de eliminar este archivo?')) {
                  deleteFileMutation.mutate(id);
                }
              }}
            />
          )}
      </section>

      <CreateFolderModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        folderToEdit={folderToEdit}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['folders'] })}
      />
    </div>
  );
}
