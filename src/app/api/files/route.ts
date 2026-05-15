// app/api/files/route.ts — Listado de archivos
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/files — Listar archivos (filtros: folderId, search)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get('folderId');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: any = { isDeleted: false };
  if (folderId) where.folderId = folderId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { hasSome: [search] } },
    ];
  }

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        folder: { select: { name: true, color: true } },
        uploadedBy: { select: { name: true } },
      },
    }),
    prisma.file.count({ where }),
  ]);

  // Serializar BigInt a number para JSON
  const serializedFiles = files.map((f) => ({
    ...f,
    fileSize: Number(f.fileSize),
  }));

  return NextResponse.json({
    files: serializedFiles,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
