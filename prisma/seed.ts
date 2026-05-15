import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('AdminGasPortal2026*', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gasportal.com' },
    update: {},
    create: {
      email: 'admin@gasportal.com',
      name: 'Administrador Principal',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Usuario admin creado:');
  console.log('Email: admin@gasportal.com');
  console.log('Password: AdminGasPortal2026*');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
