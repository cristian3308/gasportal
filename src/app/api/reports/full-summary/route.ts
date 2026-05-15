import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function POST(req: NextRequest) {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 1. Obtener toda la data
    const [folders, files, tanks, products, salesToday] = await Promise.all([
      prisma.folder.count(),
      prisma.file.count(),
      prisma.fuelTank.findMany(),
      prisma.product.findMany(),
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfDay } },
        _sum: { amount: true, fuelQuantity: true }
      })
    ]);

    const lowStock = products.filter(p => p.stock <= p.minStock).length;

    // 2. Construir el mensaje detallado
    let message = `📊 <b>RESUMEN GENERAL GASPORTAL</b> 📊\n`;
    message += `📅 <i>${format(today, "EEEE dd 'de' MMMM", { locale: es })}</i>\n`;
    message += `──────────────────\n\n`;

    message += `💰 <b>VENTAS DE HOY</b>\n`;
    message += `• Total: <b>$ ${(salesToday._sum.amount || 0).toLocaleString()} COP</b>\n`;
    message += `• Galones: <b>${(salesToday._sum.fuelQuantity || 0).toLocaleString()} Gal</b>\n\n`;

    message += `⛽ <b>ESTADO DE TANQUES</b>\n`;
    tanks.forEach(t => {
      const perc = Math.round((t.currentLevel / t.capacity) * 100);
      const status = perc < 20 ? '🚨' : '✅';
      message += `${status} ${t.fuelType}: <b>${t.currentLevel.toLocaleString()} Gal</b> (${perc}%)\n`;
    });
    message += `\n`;

    message += `🛢️ <b>LUBRICANTES</b>\n`;
    message += `• Total ítems: ${products.length}\n`;
    message += `• Alertas stock bajo: <b>${lowStock}</b> ${lowStock > 0 ? '⚠️' : '✅'}\n\n`;

    message += `📂 <b>GESTIÓN DE ARCHIVOS</b>\n`;
    message += `• Carpetas: ${folders}\n`;
    message += `• Archivos totales: ${files}\n\n`;

    message += `──────────────────\n`;
    message += `<i>Generado desde el Panel de Control</i>`;

    // 3. Enviar a Telegram
    await sendTelegramMessage(message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
