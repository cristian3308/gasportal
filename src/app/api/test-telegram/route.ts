import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    await sendTelegramMessage(`
🚀 <b>¡CONEXIÓN EXITOSA!</b>
──────────────────
Este es un mensaje de prueba de <b>GasPortal</b>. 
Si estás viendo esto, significa que tu Token y Chat ID están correctamente configurados.

✅ <i>¡Todo listo para recibir alertas reales!</i>
    `);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
