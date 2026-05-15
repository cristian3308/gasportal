import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// GET /api/admin/codes — Listar códigos de invitación
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const codes = await prisma.invitationCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        usedBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ codes });
  } catch (error: any) {
    console.error('Error fetching codes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/codes — Generar nuevo código
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { role = 'EMPLOYEE', expiresAt } = body;

    // Generar código aleatorio de 8 caracteres
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    const invitationCode = await prisma.invitationCode.create({
      data: {
        code,
        role,
        createdById: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ invitationCode }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating code:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
