/**
 * Harness di riproduzione locale: semina store + ingredienti, poi esegue
 * Step A (semilavorati) e Step B (ricette finali) usando le VERE funzioni di db.ts.
 * Serve a far emergere gli errori di import senza dover usare la UI.
 *
 *   DATABASE_URL=... npx tsx scripts/repro-import.ts
 */
import "dotenv/config";
import crypto from "crypto";
import { getDb, importSemiFinishedBulk, importFinalRecipesBulk } from "../server/db";
import { stores, ingredients } from "../drizzle/schema";
import { REC_SEMILAVORATI_ROWS, REC_SEMILAVORATI_METADATA } from "../client/src/data/rec-semilavorati-seed";
import { REC_FINALE_ROWS, REC_FINALE_METADATA } from "../client/src/data/rec-finale-seed";

const STORE_ID = "store-local-repro";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DB non disponibile (DATABASE_URL?)");

  // 1) store
  await db.insert(stores).values({ id: STORE_ID, name: "Repro Store", isActive: true, isGlobal: false } as any)
    .onDuplicateKeyUpdate({ set: { name: "Repro Store" } });

  // 2) ingredienti: un record per ogni nome unico nei due seed, prezzo derivato
  const priceByName = new Map<string, number>();
  for (const r of [...REC_SEMILAVORATI_ROWS, ...REC_FINALE_ROWS]) {
    const qtyKg = r.um === 1000 ? r.qty / 1000 : r.qty;
    const price = qtyKg > 0 ? r.eur_riga / qtyKg : 0;
    if (!priceByName.has(r.ingrediente_nome)) priceByName.set(r.ingrediente_nome, price);
  }
  let seeded = 0;
  for (const [name, price] of priceByName) {
    // salta i nomi che sono semilavorati (verranno creati dall'import), li lascio
    // comunque: se esistono come ingrediente il match userà quelli — va bene per il test
    await db.insert(ingredients).values({
      id: crypto.randomUUID(),
      name,
      category: "Altro",
      unitType: "k",
      packageQuantity: "1",
      packagePrice: String(price.toFixed(2)),
      pricePerKgOrUnit: String(price.toFixed(2)),
    } as any).catch(() => {});
    seeded++;
  }
  console.log(`Seed: 1 store, ${seeded} ingredienti`);

  // 3) STEP A — semilavorati
  console.log("\n=== STEP A: importSemiFinishedBulk ===");
  try {
    const a = await importSemiFinishedBulk(REC_SEMILAVORATI_ROWS, REC_SEMILAVORATI_METADATA as any, STORE_ID);
    console.log(`  creati: ${a.created.length} | non collegati: ${a.unmatched.length}`);
    if (a.unmatched.length) console.log("  unmatched:", a.unmatched.slice(0, 10));
  } catch (e: any) {
    console.error("  ❌ ERRORE STEP A:", e?.message);
    console.error(e?.stack);
  }

  // 4) STEP B — ricette finali
  console.log("\n=== STEP B: importFinalRecipesBulk ===");
  try {
    const b = await importFinalRecipesBulk(REC_FINALE_ROWS, REC_FINALE_METADATA as any, STORE_ID);
    console.log(`  creati: ${b.created.length} | non collegati: ${b.unmatched.length}`);
    if (b.unmatched.length) console.log("  unmatched:", b.unmatched);
  } catch (e: any) {
    console.error("  ❌ ERRORE STEP B:", e?.message);
    console.error(e?.stack);
  }

  process.exit(0);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
