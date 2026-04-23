import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing all existing users...');
  
  // We need to be careful with foreign keys, but deleting users should be fine if no other tables strictly depend on them without cascade
  await prisma.user.deleteMany({});
  
  console.log('👥 Creating demo users...');

  const demoUsers = [
    {
      username: 'admin',
      password: 'admin123',
      role: RoleName.SUPER_ADMIN,
    },
    {
      username: 'james',
      password: 'james2025',
      role: RoleName.ADMIN,
    },
    {
      username: 'cashier',
      password: 'cashier123',
      role: RoleName.CASHIER,
    }
  ];

  const branch = await prisma.branch.findFirst() || await prisma.branch.create({
    data: { name: 'Main Branch', location: 'Headquarters' }
  });

  const roles = await prisma.role.findMany();
  const getRoleId = (roleName: RoleName) => roles.find(r => r.name === roleName)?.id || 1;

  for (const user of demoUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        username: user.username,
        password: hashedPassword,
        roleId: getRoleId(user.role),
        branchId: branch.id,
      }
    });
    console.log(`✅ Created user: ${user.username} (Password: ${user.password})`);
  }

  console.log('✨ User reset complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
