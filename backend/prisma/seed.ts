import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting Data Migration...');

  // 1. Create Roles
  const superadminRole = await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: {},
    create: { name: 'SUPERADMIN', description: 'Full system access' },
  });

  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Management access' },
  });

  await prisma.role.upsert({
    where: { name: 'CASHIER' },
    update: {},
    create: { name: 'CASHIER', description: 'Sales access' },
  });

  // 2. Create Default User
  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password,
      roleId: superadminRole.id,
    },
  });

  // 3. Migrate Categories
  const categoriesMap = {
    1: { slug: 'phone', title: 'Phone Accessories' },
    2: { slug: 'stationery', title: 'Stationery Items' },
    3: { slug: 'service', title: 'Services' },
  };

  for (const [id, data] of Object.entries(categoriesMap)) {
    await prisma.category.upsert({
      where: { id: parseInt(id) },
      update: data,
      create: { id: parseInt(id), ...data },
    });
  }

  // 4. Migrate Key Products (Sample from SQL Dump)
  const products = [
    { id: 1, categoryId: 1, sku: 'PH-CH-001', name: 'DC Universal MultiCharger', costPrice: 2750.00, sellPrice: 5500.00, quantity: 6 },
    { id: 2, categoryId: 1, sku: 'PH-CAB-001', name: 'USB-C Cable', costPrice: 3500.00, sellPrice: 5500.00, quantity: 15 },
    { id: 6, categoryId: 3, sku: 'SR-PRINT', name: 'Printing (B/W)', costPrice: 150.00, sellPrice: 300.00, quantity: 1, isService: true },
    { id: 10, categoryId: 2, sku: 'ST-PAP-001', name: 'Plain Paper (A4)', costPrice: 50.00, sellPrice: 150.00, quantity: 75 },
    { id: 42, categoryId: 1, sku: 'PH-ORA-001', name: 'Oraimo earphones', costPrice: 2500.00, sellPrice: 5500.00, quantity: 5 },
    { id: 45, categoryId: 1, sku: 'PH-TEC-001', name: 'Tecno BL25', costPrice: 8500.00, sellPrice: 17500.00, quantity: 18 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: product,
      create: product,
    });
  }

  console.log('✅ Migration Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
