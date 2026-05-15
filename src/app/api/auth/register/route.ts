import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, invitationCode } = body;

    if (!name || !email || !password || !invitationCode) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    // 1. Validar el código de invitación
    const codeRecord = await prisma.invitationCode.findUnique({
      where: { code: invitationCode.toUpperCase() },
    });

    if (!codeRecord || codeRecord.isUsed) {
      return NextResponse.json({ error: 'Código de invitación inválido o ya utilizado' }, { status: 400 });
    }

    if (codeRecord.expiresAt && new Date() > codeRecord.expiresAt) {
      return NextResponse.json({ error: 'El código de invitación ha expirado' }, { status: 400 });
    }

    // 2. Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 400 });
    }

    // 3. Crear el usuario
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: codeRecord.role,
        },
      });

      // 4. Marcar el código como usado
      await tx.invitationCode.update({
        where: { id: codeRecord.id },
        data: {
          isUsed: true,
          usedById: newUser.id,
        },
      });

      return newUser;
    });

    return NextResponse.json({ message: 'Usuario registrado con éxito' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
