'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format-bytes';

interface UploadDropzoneProps {
  folderId: string;
  onUploadComplete: () => void;
}

interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export function UploadDropzone({ folderId, onUploadComplete }: UploadDropzoneProps) {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);

  const uploadFile = async (file: File) => {
    // Subir a través del backend (Next.js API proxy) para evitar problemas de CORS de Digital Ocean Spaces
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderId || '');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploads((prev) =>
            prev.map((u) => (u.file === file ? { ...u, progress: pct } : u))
          );
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.error || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.open('POST', '/api/files/upload');
      xhr.send(formData);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploads: FileUploadState[] = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploads((prev) => [...prev, ...newUploads]);

    let anySuccess = false;

    for (const file of acceptedFiles) {
      setUploads((prev) =>
        prev.map((u) => (u.file === file ? { ...u, status: 'uploading' } : u))
      );
      try {
        await uploadFile(file);
        setUploads((prev) =>
          prev.map((u) => (u.file === file ? { ...u, status: 'done', progress: 100 } : u))
        );
        anySuccess = true;
      } catch (err: any) {
        setUploads((prev) =>
          prev.map((u) =>
            u.file === file ? { ...u, status: 'error', error: err.message || 'Error al subir' } : u
          )
        );
      }
    }

    if (anySuccess) {
      onUploadComplete();
    }
  }, [folderId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 52_428_800, // 50 MB
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 scale-[1.02]'
            : 'border-border hover:border-amber-400 hover:bg-muted/50'
          }`}
      >
        <input {...getInputProps()} />
        <Upload className={`mx-auto mb-3 transition-colors ${isDragActive ? 'text-amber-500' : 'text-muted-foreground'}`} size={32} />
        <p className="text-sm font-medium">
          {isDragActive ? 'Suelta los archivos aquí...' : 'Arrastra archivos o haz clic'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          PDF, Excel, Word, imágenes · Máximo 50 MB por archivo
        </p>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={upload.file.name}>
                  {upload.file.name}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">{formatBytes(upload.file.size)}</p>
                  {upload.status === 'uploading' && (
                    <span className="text-xs font-medium text-amber-600">{upload.progress}%</span>
                  )}
                  {upload.status === 'error' && (
                    <span className="text-xs font-medium text-red-500">{upload.error}</span>
                  )}
                </div>
                {upload.status === 'uploading' && (
                  <div className="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>
              {upload.status === 'done' && <CheckCircle size={20} className="text-green-500 shrink-0" />}
              {upload.status === 'error' && <AlertCircle size={20} className="text-red-500 shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
