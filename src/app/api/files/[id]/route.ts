// app/api/files/[id]/route.ts — Operaciones sobre archivo individual
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generatePresignedDownloadUrl, deleteFromSpaces } from '@/lib/spaces';

// GET /api/files/:id — Obtener archivo y URL de descarga
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const file = await prisma.file.findUnique({
    where: { id, isDeleted: false },
    include: {
      folder: { select: { name: true } },
      uploadedBy: { select: { name: true } },
    },
  });

  if (!file) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  // Generar URL de descarga
  const downloadUrl = await generatePresignedDownloadUrl(file.storageKey, file.name);

  // Incrementar contador de descargas
  await prisma.file.update({
    where: { id },
    data: { downloadCount: { increment: 1 } },
  });

  return NextResponse.json({
    file: { ...file, fileSize: Number(file.fileSize) },
    downloadUrl,
  });
}

// DELETE /api/files/:id — Soft delete de archivo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const file = await prisma.file.findUnique({ where: { id } });

  if (!file) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  // Soft delete (no borramos de Spaces aún)
  await prisma.file.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'delete_file',
      entityType: 'file',
      entityId: id,
      metadata: { name: file.name, storageKey: file.storageKey },
    },
  });

  return NextResponse.json({ message: 'Archivo eliminado' });
}
