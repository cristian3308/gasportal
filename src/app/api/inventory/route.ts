import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/inventory — Listar productos y tanques
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const [products, tanks] = await Promise.all([
      prisma.product.findMany({ orderBy: { name: 'asc' } }),
      prisma.fuelTank.findMany({ orderBy: { fuelType: 'asc' } }),
    ]);

    return NextResponse.json({ products, tanks });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inventory/products — Crear o actualizar producto
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, brand, stock, price, minStock, category } = body;

    const product = await prisma.product.create({
      data: {
        name,
        brand,
        stock: parseFloat(stock),
        price: parseFloat(price),
        minStock: parseFloat(minStock),
        category: category || 'LUBRICANTE',
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/inventory — Actualizar producto o tanque
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, type, ...updates } = body;

    if (type === 'PRODUCT') {
      const product = await prisma.product.update({
        where: { id },
        data: {
          name: updates.name,
          brand: updates.brand,
          stock: parseFloat(updates.stock),
          price: parseFloat(updates.price),
          minStock: parseFloat(updates.minStock),
        },
      });
      return NextResponse.json({ product });
    }

    if (type === 'TANK') {
      const tank = await prisma.fuelTank.update({
        where: { id },
        data: {
          fuelType: updates.fuelType,
          currentLevel: parseFloat(updates.currentLevel),
          capacity: parseFloat(updates.capacity),
          lastReading: new Date(),
        },
      });
      return NextResponse.json({ tank });
    }

    return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

