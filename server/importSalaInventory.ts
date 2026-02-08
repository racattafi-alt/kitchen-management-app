import { getDb } from "./db";
import { ingredients } from "../drizzle/schema";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Script per importare inventario sala da JSON
 * 
 * Esegui con: node --loader tsx server/importSalaInventory.ts
 */

interface SalaItem {
  category: string;
  subcategory: string | null;
  name: string;
  supplier: string;
  price: number;
}

async function importSalaInventory() {
  console.log("🚀 Inizio importazione inventario sala...\n");

  // Ottieni connessione database
  const db = await getDb();
  if (!db) {
    throw new Error("Impossibile connettersi al database");
  }

  // Leggi file JSON
  const jsonPath = path.join(__dirname, "../../upload/inventario_sala_completo.json");
  const jsonData = fs.readFileSync(jsonPath, "utf-8");
  const jsonObj = JSON.parse(jsonData);
  const salaItems: SalaItem[] = jsonObj.inventory_sala || [];

  console.log(`📦 Trovati ${salaItems.length} prodotti da importare\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of salaItems) {
    try {
      // Mappa categoria JSON a categoria database
      const categoryMap: Record<string, string> = {
        "Bibite": "Bevande",
        "Birre": "Birra",
        "Caffè": "Bevande",
        "Alcolici": "Alcolici",
        "Vini": "Alcolici",
        "Altro": "Altro",
      };

      const category = categoryMap[item.category] || "Altro";

      // Prezzo 0 se non specificato
      const price = item.price || 0;

      // Inserisci nel database
      const insertData: any = {
        id: randomUUID(),
        name: item.name,
        supplier: item.supplier,
        category: category as any,
        unitType: "u", // Default unità
        packageQuantity: "1",
        packagePrice: price.toString(),
        pricePerKgOrUnit: price.toString(),
        isActive: true,
        isFood: false, // Prodotti sala non sono food
        isOrderable: true,
        isSellable: true,
        isSalaItem: true, // FLAG IMPORTANTE
      };
      
      // Aggiungi subcategory solo se non vuota
      if (item.subcategory) {
        insertData.subcategory = item.subcategory;
      }
      
      await db.insert(ingredients).values(insertData);

      imported++;
      
      if (imported % 50 === 0) {
        console.log(`✅ Importati ${imported}/${salaItems.length} prodotti...`);
      }
    } catch (error: any) {
      if (error.message?.includes("Duplicate entry")) {
        skipped++;
      } else {
        console.error(`❌ Errore importando "${item.name}":`, error.message);
        errors++;
      }
    }
  }

  console.log("\n📊 RIEPILOGO IMPORTAZIONE:");
  console.log(`✅ Importati: ${imported}`);
  console.log(`⏭️  Saltati (duplicati): ${skipped}`);
  console.log(`❌ Errori: ${errors}`);
  console.log(`📦 Totale: ${salaItems.length}`);

  process.exit(0);
}

// Esegui importazione
importSalaInventory().catch((error) => {
  console.error("💥 Errore fatale:", error);
  process.exit(1);
});
