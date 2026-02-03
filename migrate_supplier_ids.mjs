import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { ingredients, suppliers } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

async function migrateSupplierIds() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
  });

  const db = drizzle(connection);

  console.log("🔄 Inizio migrazione supplierId...");

  // 1. Recupera tutti i fornitori
  const allSuppliers = await db.select().from(suppliers);
  console.log(`✅ Trovati ${allSuppliers.length} fornitori`);

  // Crea mappa nome → id
  const supplierMap = new Map();
  for (const supplier of allSuppliers) {
    supplierMap.set(supplier.name.toLowerCase().trim(), supplier.id);
  }

  // 2. Recupera tutti gli ingredienti
  const allIngredients = await db.select().from(ingredients);
  console.log(`✅ Trovati ${allIngredients.length} ingredienti`);

  let updated = 0;
  let notFound = 0;
  let alreadySet = 0;

  // 3. Aggiorna supplierId per ogni ingrediente
  for (const ingredient of allIngredients) {
    if (ingredient.supplierId) {
      alreadySet++;
      continue;
    }

    if (!ingredient.supplier) {
      notFound++;
      console.log(`⚠️  Ingrediente "${ingredient.name}" non ha fornitore`);
      continue;
    }

    const supplierName = ingredient.supplier.toLowerCase().trim();
    const supplierId = supplierMap.get(supplierName);

    if (supplierId) {
      await db
        .update(ingredients)
        .set({ supplierId })
        .where(eq(ingredients.id, ingredient.id));
      updated++;
      console.log(`✅ ${ingredient.name} → ${ingredient.supplier} (${supplierId})`);
    } else {
      notFound++;
      console.log(`❌ Fornitore "${ingredient.supplier}" non trovato per "${ingredient.name}"`);
    }
  }

  console.log("\n📊 Riepilogo migrazione:");
  console.log(`   - Aggiornati: ${updated}`);
  console.log(`   - Già impostati: ${alreadySet}`);
  console.log(`   - Non trovati: ${notFound}`);
  console.log(`   - Totale: ${allIngredients.length}`);

  await connection.end();
  console.log("\n✅ Migrazione completata!");
}

migrateSupplierIds().catch((error) => {
  console.error("❌ Errore durante la migrazione:", error);
  process.exit(1);
});
