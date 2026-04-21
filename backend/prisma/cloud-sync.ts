/**
 * Cloud Sync: Local PostgreSQL → Supabase PostgreSQL
 * Synchronizes all records from the local DB into the cloud.
 */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// SUPABASE CLIENT (via Prisma)
const cloudPool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(cloudPool);
const prismaCloud = new PrismaClient({ adapter });

// LOCAL CLIENT (via raw pg)
const localPool = new Pool({ connectionString: process.env.LOCAL_DATABASE_URL });

async function syncTable(tableName: string, modelName: string, idField: string = 'id') {
    console.log(`📡 Syncing table: ${tableName}...`);
    const { rows } = await localPool.query(`SELECT * FROM "${tableName}"`);
    console.log(`   - Found ${rows.length} records locally.`);
    
    let count = 0;
    for (const row of rows) {
        try {
            await (prismaCloud[modelName as any] as any).upsert({
                where: { [idField]: row[idField] },
                update: row,
                create: row,
            });
            count++;
        } catch (e: any) {
            console.error(`   ❌ Error syncing ${tableName} ID ${row[idField]}:`, e.message);
        }
    }
    console.log(`   ✅ Finished ${tableName}: ${count}/${rows.length} synced.\n`);
}

async function main() {
  console.log('🚀 INITIALIZING LOCAL → CLOUD DATA SYNC...\n');

  try {
      // 1. Roles
      await syncTable('Role', 'role', 'name'); // Logic: names are unique
      
      // 2. Branches
      await syncTable('Branch', 'branch');

      // 3. Categories
      await syncTable('Category', 'category');

      // 4. Customers
      await syncTable('Customer', 'customer');

      // 5. Users
      await syncTable('User', 'user', 'username');

      // 6. Products
      await syncTable('Product', 'product');

      // 7. Sales
      await syncTable('Sale', 'sale', 'invoiceNo');

      // 8. SaleItems
      await syncTable('SaleItem', 'saleItem');

      console.log('🎉 ============================================');
      console.log('   CLOUD DATA MIGRATION COMPLETE!');
      console.log('   YOUR SYSTEM IS NOW FULLY CLOUD-POWERED.');
      console.log('   ============================================\n');

  } catch (error: any) {
      console.error('❌ Sync failed:', error.message);
  } finally {
      await prismaCloud.$disconnect();
      await cloudPool.end();
      await localPool.end();
  }
}

main();
