// app/api/folders/[id]/route.ts — Operaciones sobre carpeta individual
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateFolderSchema } from '@/lib/validations/folder.schema';

// GET /api/folders/:id — Obtener carpeta con archivos
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const folder = await prisma.folder.findUnique({
    where: { id },
    include: {
      files: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { name: true } },
        },
      },
      children: {
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { files: { where: { isDeleted: false } } } },
        },
      },
      parent: { select: { id: true, name: true } },
    },
  });

  if (!folder) {
    return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ folder });
}

// PATCH /api/folders/:id — Actualizar carpeta
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const result = updateFolderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const folder = await prisma.folder.update({
    where: { id },
    data: result.data,
  });

  return NextResponse.json({ folder });
}

// DELETE /api/folders/:id — Eliminar carpeta
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const folder = await prisma.folder.findUnique({
    where: { id },
    include: { _count: { select: { files: true } } },
  });

  if (!folder) {
    return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
  }

  if (folder.isDefault) {
    return NextResponse.json({ error: 'No se puede eliminar una carpeta del sistema' }, { status: 400 });
  }

  await prisma.folder.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'delete_folder',
      entityType: 'folder',
      entityId: id,
      metadata: { name: folder.name },
    },
  });

  return NextResponse.json({ message: 'Carpeta eliminada' });
}
