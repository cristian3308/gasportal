'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Folder as FolderIcon, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadDropzone } from '@/components/files/UploadDropzone';
import { FileList } from '@/components/files/FileList';
import { FolderGrid } from '@/components/files/FolderGrid';
import { CreateFolderModal } from '@/components/files/CreateFolderModal';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function FolderPage() {
  const { folderId } = useParams();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<any>(null);

  // Fetch Carpeta individual y su contenido
  const { data: folderData, isLoading } = useQuery({
    queryKey: ['folder', folderId],
    queryFn: async () => {
      const res = await fetch(`/api/folders/${folderId}`);
      if (!res.ok) throw new Error('Error cargando la carpeta');
      return res.json();
    }
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
      queryClient.invalidateQueries({ queryKey: ['folder', folderId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: any) => toast.error(error.message)
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
      queryClient.invalidateQueries({ queryKey: ['folder', folderId] });
    },
    onError: (error: any) => toast.error(error.message)
  });

  const folder = folderData?.folder;

  const handleEditFolder = (f: any) => {
    setFolderToEdit(f);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setFolderToEdit(null), 300);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando contenido...</div>;
  }

  if (!folder) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Carpeta no encontrada o eliminada.</p>
        <Link href="/archivos" className="text-amber-500 mt-4 inline-block hover:underline">
          Volver a archivos
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href={folder.parentId ? `/archivos/${folder.parentId}` : "/archivos"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${folder.color}-500/10 text-${folder.color}-500`}>
              <FolderIcon size={24} className="fill-current opacity-80" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{folder.name}</h1>
              {folder.description && (
                <p className="text-sm text-muted-foreground">{folder.description}</p>
              )}
            </div>
          </div>
        </div>

        <Button onClick={() => setIsModalOpen(true)} variant="outline" className="shrink-0">
          <FolderPlus className="w-4 h-4 mr-2" />
          Nueva Subcarpeta
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Sección de Subcarpetas (solo se muestra si hay o si queremos permitir crearlas aquí visualmente) */}
          {folder.children && folder.children.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">Subcarpetas</h2>
              <FolderGrid 
                folders={folder.children} 
                onEdit={handleEditFolder}
                onDelete={(id) => {
                  if(confirm('¿Estás seguro de eliminar esta subcarpeta y todo su contenido?')) {
                    deleteFolderMutation.mutate(id);
                  }
                }}
              />
            </div>
          )}

          {/* Sección de Archivos */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">Archivos en esta carpeta</h2>
            <FileList 
              files={folder.files} 
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ['folder', folderId] })}
              onDelete={(id) => {
                if(confirm('¿Estás seguro de eliminar este archivo?')) {
                  deleteFileMutation.mutate(id);
                }
              }}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="sticky top-24">
            <h2 className="text-lg font-semibold tracking-tight mb-4">Subir Archivos</h2>
            <div className="bg-card border rounded-xl p-4 shadow-sm">
              <UploadDropzone 
                folderId={folder.id} 
                onUploadComplete={() => {
                  toast.success('Archivos subidos exitosamente');
                  queryClient.invalidateQueries({ queryKey: ['folder', folderId] });
                  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      <CreateFolderModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        folderToEdit={folderToEdit}
        parentId={folderId as string}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['folder', folderId] })}
      />
    </div>
  );
}
