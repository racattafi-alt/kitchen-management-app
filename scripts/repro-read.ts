import "dotenv/config";
import { getDb, importSemiFinishedBulk, importFinalRecipesBulk,
  getFinalRecipes, getAllFinalRecipes, listUnmatchedComponents,
  getSemiFinishedComponentsRelational, getRecipeComponents } from "../server/db";
import { semiFinishedRecipes, finalRecipes } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { REC_SEMILAVORATI_ROWS, REC_SEMILAVORATI_METADATA } from "../client/src/data/rec-semilavorati-seed";
import { REC_FINALE_ROWS, REC_FINALE_METADATA } from "../client/src/data/rec-finale-seed";

const STORE_ID = "store-local-repro";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("no db");

  // (a) RE-IMPORT senza cancellare → riproduce il doppio clic / re-import
  console.log("=== TEST (a): re-import senza delete (Step A di nuovo) ===");
  try {
    const r = await importSemiFinishedBulk(REC_SEMILAVORATI_ROWS, REC_SEMILAVORATI_METADATA as any, STORE_ID);
    console.log(`  OK creati=${r.created.length} unmatched=${r.unmatched.length}`);
  } catch (e: any) {
    console.error("  ❌ ERRORE re-import A:", e?.message?.split("\n")[0]);
    console.error("     code:", e?.code, "| errno:", e?.errno, "| sqlState:", e?.sqlState);
  }
  console.log("\n=== TEST (a2): re-import Step B senza delete ===");
  try {
    const r = await importFinalRecipesBulk(REC_FINALE_ROWS, REC_FINALE_METADATA as any, STORE_ID);
    console.log(`  OK creati=${r.created.length} unmatched=${r.unmatched.length}`);
  } catch (e: any) {
    console.error("  ❌ ERRORE re-import B:", e?.message?.split("\n")[0]);
    console.error("     code:", e?.code, "| errno:", e?.errno, "| sqlState:", e?.sqlState);
  }

  // (b) LETTURA come fanno le pagine
  console.log("\n=== TEST (b): letture pagine ===");
  try {
    const fr = await getFinalRecipes(STORE_ID);
    console.log(`  getFinalRecipes: ${fr.length} ricette`);
    const allfr = await getAllFinalRecipes();
    console.log(`  getAllFinalRecipes: ${allfr.length}`);
    const unm = await listUnmatchedComponents();
    console.log(`  listUnmatchedComponents: ${unm.length} componenti non collegati`);

    // componenti di una ricetta finale e di un semilavorato
    const [oneSemi] = await db.select({ id: semiFinishedRecipes.id, name: semiFinishedRecipes.name })
      .from(semiFinishedRecipes).where(eq(semiFinishedRecipes.storeId, STORE_ID)).limit(1);
    if (oneSemi) {
      const comps = await getSemiFinishedComponentsRelational(oneSemi.id);
      console.log(`  getSemiFinishedComponentsRelational(${oneSemi.name}): ${comps.length} comp`);
    }
    const [oneFinal] = await db.select({ id: finalRecipes.id, name: finalRecipes.name })
      .from(finalRecipes).where(eq(finalRecipes.storeId, STORE_ID)).limit(1);
    if (oneFinal) {
      const comps = await getRecipeComponents(oneFinal.id);
      console.log(`  getRecipeComponents(${oneFinal.name}): ${comps.length} comp`);
    }
  } catch (e: any) {
    console.error("  ❌ ERRORE lettura:", e?.message);
    console.error(e?.stack);
  }

  process.exit(0);
}
main().catch((e) => { console.error("FATAL:", e?.message); console.error(e?.stack); process.exit(1); });
