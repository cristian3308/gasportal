// app/api/files/presigned/route.ts — URL prefirmada para subida directa
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePresignedUploadUrl, buildStorageKey } from '@/lib/spaces';
import { prisma } from '@/lib/prisma';
import { presignedUploadSchema, ALLOWED_MIME_TYPES } from '@/lib/validations/file.schema';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const result = presignedUploadSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { fileName, fileSize, mimeType, folderId, description } = result.data;

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
  }

  // Verificar que la carpeta existe
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) {
    return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
  }

  const storageKey = buildStorageKey(session.user.id, folderId, fileName);
  const uploadUrl = await generatePresignedUploadUrl(storageKey, mimeType);

  // Crear el registro en BD
  const file = await prisma.file.create({
    data: {
      folderId,
      uploadedById: session.user.id,
      name: fileName,
      storageKey,
      fileSize: BigInt(fileSize),
      mimeType,
      extension: fileName.split('.').pop()?.toLowerCase(),
      description,
    },
  });

  // Registrar en auditoría
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'upload_file_initiated',
      entityType: 'file',
      entityId: file.id,
      metadata: { fileName, fileSize, folderId },
    },
  });

  return NextResponse.json({
    uploadUrl,
    fileId: file.id,
    storageKey,
  });
}
