import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import * as schema from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

console.log("=== TEST MANUALE LISTA ACQUISTI ===\n");

// 1. Verifica produzioni
const productions = await db.select().from(schema.weeklyProductions);
console.log(`✓ Produzioni trovate: ${productions.length}`);
productions.forEach(p => {
  console.log(`  - ID: ${p.id}, Ricetta: ${p.recipeFinalId}, Quantità: ${p.desiredQuantity}`);
});

// 2. Verifica ricette
for (const prod of productions) {
  const recipe = await db.select().from(schema.finalRecipes).where(eq(schema.finalRecipes.id, prod.recipeFinalId)).limit(1);
  if (recipe[0]) {
    const components = JSON.parse(recipe[0].components || "[]");
    console.log(`\n✓ Ricetta: ${recipe[0].name}`);
    console.log(`  Componenti: ${components.length}`);
    components.slice(0, 3).forEach(c => {
      console.log(`    - ${c.name || c.ingredientId} (qty: ${c.qty})`);
    });
  }
}

console.log("\n=== FINE TEST ===");
process.exit(0);
