// lib/utils/format-bytes.ts — Formatea bytes a unidades legibles
export function formatBytes(bytes: number | bigint, decimals = 1): string {
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (numBytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));

  return `${parseFloat((numBytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
