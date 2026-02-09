import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { ingredients } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const data = JSON.parse(await fs.readFile('/home/ubuntu/sala_complete_data.json', 'utf-8'));

console.log(`🔄 Aggiornamento ${data.length} ingredienti sala...`);

let updated = 0;
for (const item of data) {
  try {
    await db.update(ingredients)
      .set({
        name: item.name,
        supplier: item.supplier,
        category: item.category,
        unitType: item.unitType,
        packageQuantity: item.packageQuantity,
        packagePrice: item.packagePrice,
        pricePerKgOrUnit: item.pricePerKgOrUnit,
        minOrderQuantity: item.minOrderQuantity,
        packageType: item.packageType || null,
        brand: item.brand || '',
        notes: item.notes || '',
        updatedAt: new Date()
      })
      .where(eq(ingredients.id, item.id));
    
    updated++;
    if (updated % 20 === 0) {
      console.log(`  ✅ ${updated}/${data.length} aggiornati`);
    }
  } catch (err) {
    console.error(`  ❌ Errore ${item.id}:`, err.message);
  }
}

await connection.end();
console.log(`\n🎉 Completato! ${updated}/${data.length} ingredienti aggiornati`);
