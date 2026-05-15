import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const [files, folders, payments] = await Promise.all([
      // Buscar archivos
      prisma.file.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
          isDeleted: false,
        },
        take: 5,
        select: { id: true, name: true, folderId: true },
      }),
      // Buscar carpetas
      prisma.folder.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, name: true, parentId: true },
      }),
      // Buscar pagos
      prisma.payment.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, title: true },
      }),
    ]);

    const results = [
      ...files.map((f) => ({ id: f.id, title: f.name, type: 'file', folderId: f.folderId })),
      ...folders.map((f) => ({ id: f.id, title: f.name, type: 'folder', parentId: f.parentId })),
      ...payments.map((p) => ({ id: p.id, title: p.title, type: 'payment' })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
