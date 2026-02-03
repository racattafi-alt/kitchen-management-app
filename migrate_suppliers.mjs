#!/usr/bin/env node
/**
 * Script per eseguire la migrazione fornitori da ingredienti
 * usando la procedura tRPC suppliers.migrateFromIngredients
 */

import { drizzle } from "drizzle-orm/mysql2";
import { suppliers, ingredients } from "./drizzle/schema.ts";
import { nanoid } from "nanoid";

const db = drizzle(process.env.DATABASE_URL);

console.log("🔄 Inizio migrazione fornitori...\n");

// 1. Estrai fornitori unici dagli ingredienti
const allIngredients = await db.select().from(ingredients);
const uniqueSuppliers = Array.from(
  new Set(allIngredients.map(i => i.supplier).filter(Boolean))
);

console.log(`📊 Trovati ${uniqueSuppliers.length} fornitori unici`);
console.log(`📦 Totale ingredienti: ${allIngredients.length}\n`);

// 2. Inserisci i fornitori nella tabella suppliers
let created = 0;
let skipped = 0;

for (const supplierName of uniqueSuppliers) {
  try {
    await db.insert(suppliers).values({
      id: nanoid(),
      name: supplierName,
      contact: null,
      email: null,
      phone: null,
      address: null,
      notes: null,
    });
    created++;
    console.log(`✅ Creato: ${supplierName}`);
  } catch (error) {
    if (error.message?.includes("Duplicate")) {
      skipped++;
      console.log(`⚠️  Già esistente: ${supplierName}`);
    } else {
      console.error(`❌ Errore per ${supplierName}:`, error.message);
    }
  }
}

console.log(`\n✨ Migrazione completata!`);
console.log(`   Creati: ${created}`);
console.log(`   Saltati (già esistenti): ${skipped}`);
console.log(`   Totale: ${uniqueSuppliers.length}`);

process.exit(0);
