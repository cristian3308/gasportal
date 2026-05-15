import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/inventory/movements — Registrar entrada (Viaje/Compra)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { type, fuelTankId, productId, quantity, description } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el movimiento
      const movement = await tx.inventoryMovement.create({
        data: {
          type, // IN, OUT, ADJUST
          fuelTankId,
          productId,
          quantity: parseFloat(quantity),
          description,
          createdById: (session.user as any).id,
        },
      });

      // 2. Actualizar stock según el tipo
      const modifier = type === 'IN' ? { increment: parseFloat(quantity) } : { decrement: parseFloat(quantity) };

      if (fuelTankId) {
        await tx.fuelTank.update({
          where: { id: fuelTankId },
          data: {
            currentLevel: modifier,
            lastReading: new Date(),
          },
        });
      }

      if (productId) {
        await tx.product.update({
          where: { id: productId },
          data: {
            stock: modifier,
          },
        });
      }

      return movement;
    });

    return NextResponse.json({ movement: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording movement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/inventory/movements — Historial de movimientos
export async function GET(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
  
      const movements = await prisma.inventoryMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          createdBy: { select: { name: true } },
          fuelTank: { select: { fuelType: true } },
          product: { select: { name: true } },
        },
      });
  
      return NextResponse.json({ movements });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
