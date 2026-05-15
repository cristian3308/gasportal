// lib/validations/folder.schema.ts
import { z } from 'zod';

export const createFolderSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(300).optional(),
  color: z.string().default('amber'),
  icon: z.string().default('folder'),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateFolderSchema = createFolderSchema.partial();

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
