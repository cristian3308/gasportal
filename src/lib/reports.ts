import { prisma } from './prisma';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { spacesClient } from './spaces';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { sendTelegramMessage } from './telegram';

export async function generateDailyReport() {
  try {
    const now = new Date();
    const todayStr = format(now, 'dd-MM-yyyy', { locale: es });
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 1. Obtener datos
    const [sales, tanks, products] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: startOfDay } },
        include: { createdBy: { select: { name: true } } }
      }),
      prisma.fuelTank.findMany(),
      prisma.product.findMany()
    ]);

    const totalSales = sales.reduce((acc, s) => acc + s.amount, 0);

    // 2. Crear PDF
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11); // Amber-500
    doc.text('GasPortal - Reporte Operativo', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${todayStr}`, 14, 28);
    doc.text(`Generado automáticamente`, 14, 33);

    // Resumen de Ventas
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Resumen de Ventas Hoy', 14, 45);
    doc.autoTable({
      startY: 50,
      head: [['Categoría', 'Monto Total', 'Transacciones']],
      body: [
        ['Combustible', `$ ${sales.filter(s => s.category === 'COMBUSTIBLE').reduce((acc, s) => acc + s.amount, 0).toLocaleString()}`, sales.filter(s => s.category === 'COMBUSTIBLE').length],
        ['Lubricantes', `$ ${sales.filter(s => s.category === 'LUBRICANTES').reduce((acc, s) => acc + s.amount, 0).toLocaleString()}`, sales.filter(s => s.category === 'LUBRICANTES').length],
        ['TOTAL DÍA', `$ ${totalSales.toLocaleString()}`, sales.length]
      ],
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] }
    });

    // Estado de Tanques
    doc.text('Estado de Tanques (Cierre)', 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Tipo de Combustible', 'Nivel Actual', 'Capacidad', '%']],
      body: tanks.map(t => [
        t.fuelType, 
        `${t.currentLevel.toLocaleString()} Gal`, 
        `${t.capacity.toLocaleString()} Gal`,
        `${Math.round((t.currentLevel / t.capacity) * 100)}%`
      ]),
      headStyles: { fillColor: [59, 130, 246] } // Blue-500
    });

    // Stock de Lubricantes Críticos
    const lowStock = products.filter(p => p.stock <= p.minStock);
    if (lowStock.length > 0) {
      doc.text('Alertas de Stock Bajo', 14, doc.lastAutoTable.finalY + 15);
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Producto', 'Marca', 'Stock Actual', 'Mínimo']],
        body: lowStock.map(p => [p.name, p.brand || '-', p.stock, p.minStock]),
        headStyles: { fillColor: [239, 68, 68] } // Red-500
      });
    }

    // 3. Convertir a Buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const fileName = `Reporte_${todayStr}.pdf`;
    const storageKey = `system/reports/${Date.now()}-${fileName}`;

    // 4. Subir a Spaces
    await spacesClient.send(new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: storageKey,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ACL: 'private'
    }));

    // 5. Registrar en Base de Datos (Buscar Carpeta o Crear)
    let folder = await prisma.folder.findFirst({
      where: { name: 'Reportes de Inventario y Ventas' }
    });

    if (!folder) {
      folder = await prisma.folder.create({
        data: {
          name: 'Reportes de Inventario y Ventas',
          color: 'amber',
          icon: 'file-text'
        }
      });
    }

    await prisma.file.create({
      data: {
        name: fileName,
        storageKey: storageKey,
        fileSize: BigInt(pdfBuffer.length),
        mimeType: 'application/pdf',
        folderId: folder.id,
        extension: 'pdf'
      }
    });

    // 6. Notificar por Telegram
    await sendTelegramMessage(`
✅ <b>REPORTE DIARIO GENERADO</b>
──────────────────
📅 <b>Fecha:</b> ${todayStr}
💰 <b>Ventas Totales:</b> $ ${totalSales.toLocaleString()} COP
⛽ <b>Combustible:</b> ${sales.filter(s => s.category === 'COMBUSTIBLE').reduce((acc, s) => acc + (s.fuelQuantity || 0), 0).toLocaleString()} Gal
📊 <i>El reporte detallado ya está disponible en la sección de Archivos.</i>
    `);

    return { success: true, fileName };
  } catch (error) {
    console.error('Error generating daily report:', error);
    throw error;
  }
}
