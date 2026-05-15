// lib/spaces.ts — Cliente Digital Ocean Spaces (compatible con API S3)
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const spacesClient = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT!,
  region: process.env.DO_SPACES_REGION!,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
  forcePathStyle: false,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET = process.env.DO_SPACES_BUCKET!;

/**
 * Genera una URL prefirmada para que el cliente suba directamente a Spaces
 * sin pasar el archivo por el servidor (más eficiente para archivos grandes)
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(spacesClient, command, { expiresIn: expiresInSeconds });
}

/**
 * Genera URL firmada para descarga temporal (30 minutos por defecto)
 */
export async function generatePresignedDownloadUrl(
  key: string,
  originalName: string,
  expiresInSeconds = 1800
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalName)}"`,
  });
  return getSignedUrl(spacesClient, command, { expiresIn: expiresInSeconds });
}

/**
 * Elimina un archivo de Spaces permanentemente
 */
export async function deleteFromSpaces(key: string): Promise<void> {
  await spacesClient.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

/**
 * Construye la key de almacenamiento con estructura organizada
 * Formato: {userId}/{folderId}/{timestamp}-{filename}
 */
export function buildStorageKey(
  userId: string,
  folderId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${folderId}/${timestamp}-${sanitized}`;
}
