// lib/validations/file.schema.ts
import { z } from 'zod';

export const presignedUploadSchema = z.object({
  fileName: z.string().min(1, 'Nombre de archivo requerido').max(255),
  fileSize: z.number().max(52_428_800, 'Máximo 50 MB por archivo'),
  mimeType: z.string(),
  folderId: z.string().uuid('ID de carpeta inválido'),
  description: z.string().max(500).optional(),
});

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/csv',
];

export type PresignedUploadInput = z.infer<typeof presignedUploadSchema>;
