import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage, formatInventoryAlert } from '@/lib/telegram';

// GET /api/sales — Listar ventas y resumen mensual
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [sales, monthlyStats] = await Promise.all([
      prisma.sale.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { name: true } },
          fuelTank: { select: { fuelType: true } },
        },
      }),
      prisma.sale.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
        },
        _sum: {
          amount: true,
          fuelQuantity: true,
        },
      }),
    ]);

    // Obtener desglose por tipo de combustible este mes
    const fuelBreakdown = await prisma.sale.groupBy({
      by: ['category'],
      where: {
        createdAt: { gte: startOfMonth },
        category: 'COMBUSTIBLE',
      },
      _sum: {
        fuelQuantity: true,
      },
    });

    return NextResponse.json({ 
      sales, 
      summary: {
        totalAmount: monthlyStats._sum.amount || 0,
        totalGallons: monthlyStats._sum.fuelQuantity || 0,
        fuelBreakdown
      }
    });
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// POST /api/sales — Registrar nueva venta y descontar inventario
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      amount, 
      paymentMethod, 
      category, 
      description,
      fuelTankId,
      fuelQuantity,
      productId,
      productQty
    } = body;

    // Crear la venta y actualizar inventario en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la venta
      const sale = await tx.sale.create({
        data: {
          amount: parseFloat(amount),
          paymentMethod,
          category,
          description,
          fuelTankId,
          fuelQuantity: fuelQuantity ? parseFloat(fuelQuantity) : null,
          productId,
          productQty: productQty ? parseInt(productQty) : null,
          createdById: (session.user as any).id,
        },
      });

      // 2. Descontar del Tanque si es combustible
      if (fuelTankId && fuelQuantity) {
        await tx.fuelTank.update({
          where: { id: fuelTankId },
          data: {
            currentLevel: { decrement: parseFloat(fuelQuantity) },
            lastReading: new Date(),
          },
        });

        // Registrar movimiento de salida
        await tx.inventoryMovement.create({
          data: {
            type: 'OUT',
            fuelTankId,
            quantity: parseFloat(fuelQuantity),
            description: `Venta #${sale.id}`,
            createdById: (session.user as any).id,
          },
        });
      }

      // 3. Descontar de Productos si es lubricante/otro
      if (productId && productQty) {
        await tx.product.update({
          where: { id: productId },
          data: {
            stock: { decrement: parseFloat(productQty.toString()) },
          },
        });

        // Registrar movimiento de salida
        await tx.inventoryMovement.create({
          data: {
            type: 'OUT',
            productId,
            quantity: parseFloat(productQty.toString()),
            description: `Venta #${sale.id}`,
            createdById: (session.user as any).id,
          },
        });
      }

      return sale;
    });

    const sale: any = result;
    
    // Notificar si el nivel es bajo (después de la transacción)
    try {
        if (fuelTankId) {
            const tank = await prisma.fuelTank.findUnique({ where: { id: fuelTankId } });
            if (tank && (tank.currentLevel / tank.capacity) < 0.20) {
              await sendTelegramMessage(formatInventoryAlert('TANK', tank));
            }
        }
        if (productId) {
            const product = await prisma.product.findUnique({ where: { id: productId } });
            if (product && product.stock <= product.minStock) {
              await sendTelegramMessage(formatInventoryAlert('PRODUCT', product));
            }
        }
    } catch (err) {
        console.error('Error enviando notificación Telegram:', err);
    }

    return NextResponse.json({ sale: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


