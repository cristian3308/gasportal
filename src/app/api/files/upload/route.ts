import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { spacesClient, buildStorageKey } from '@/lib/spaces';
import { PutObjectCommand } from '@aws-sdk/client-s3';

// Necesario para evitar límite de tamaño en el body parser de Next.js
export const maxDuration = 60; // 60 segundos
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folderId = formData.get('folderId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = buildStorageKey(session.user.id, folderId, file.name);

    // Subir a Digital Ocean Spaces directo desde el backend
    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: storageKey,
      Body: buffer,
      ContentType: file.type,
    });

    await spacesClient.send(command);

    // Guardar registro en Prisma
    const newFile = await prisma.file.create({
      data: {
        name: file.name,
        storageKey,
        fileSize: file.size,
        mimeType: file.type,
        folderId: folderId || null,
        uploadedById: session.user.id,
      },
    });

    // Registrar log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'upload_file',
        entityType: 'file',
        entityId: newFile.id,
        metadata: { name: file.name, size: file.size },
      },
    });

    return NextResponse.json({ file: newFile });
  } catch (error: any) {
    console.error('Error al subir archivo:', error);
    return NextResponse.json({ error: 'Error interno al procesar el archivo' }, { status: 500 });
  }
}
