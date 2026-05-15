// app/api/folders/route.ts — CRUD de carpetas
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFolderSchema } from '@/lib/validations/folder.schema';

// GET /api/folders — Listar carpetas (opcionalmente por parentId)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get('parentId');

  const folders = await prisma.folder.findMany({
    where: {
      parentId: parentId || null,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: {
        select: { files: { where: { isDeleted: false } }, children: true },
      },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ folders });
}

// POST /api/folders — Crear nueva carpeta
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Solo admin puede crear carpetas
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const body = await req.json();
  const result = createFolderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const folder = await prisma.folder.create({
    data: {
      ...result.data,
      createdById: session.user.id,
    },
  });

  // Registrar en auditoría
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: 'create_folder',
      entityType: 'folder',
      entityId: folder.id,
      metadata: { name: folder.name },
    },
  });

  return NextResponse.json({ folder }, { status: 201 });
}
