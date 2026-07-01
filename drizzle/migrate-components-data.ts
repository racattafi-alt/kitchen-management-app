/**
 * Script di migrazione dati: JSON components → tabelle relazionali
 *
 * Popola `recipe_components` e `semi_finished_components` leggendo i JSON blob
 * esistenti in `final_recipes.components` e `semi_finished_recipes.components`.
 *
 * Eseguire con: npx tsx drizzle/migrate-components-data.ts
 * Prerequisito: migrazione SQL 0046 già applicata al DB.
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import * as mysql from "mysql2/promise";
import * as crypto from "crypto";
import {
  finalRecipes,
  semiFinishedRecipes,
  ingredients,
  operations,
  recipeComponents,
  semiFinishedComponents,
} from "./schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL non definita");

  const connection = await mysql.createConnection(url);
  const db = drizzle(connection);

  // ── Cache per lookup veloci ────────────────────────────────────────────────

  const allIngredients = await db.select({ id: ingredients.id }).from(ingredients);
  const ingredientIds = new Set(allIngredients.map((i) => i.id));

  const allOps = await db.select({ id: operations.id, name: operations.name }).from(operations);
  const opsByName = new Map(allOps.map((o) => [o.name.toLowerCase(), o.id]));
  const opIds = new Set(allOps.map((o) => o.id));

  const allSemi = await db.select({ id: semiFinishedRecipes.id }).from(semiFinishedRecipes);
  const semiIds = new Set(allSemi.map((s) => s.id));

  // ── Helper ─────────────────────────────────────────────────────────────────

  function parseComponents(raw: unknown): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return []; }
    }
    return [];
  }

  function resolveOperationId(comp: any): string | null {
    // Prima prova con componentId diretto
    if (comp.componentId && opIds.has(comp.componentId)) return comp.componentId;
    // Fallback: cerca per nome
    const name = (comp.componentName || comp.name || "").toLowerCase();
    return opsByName.get(name) ?? null;
  }

  // ── Migra recipe_components ────────────────────────────────────────────────

  const recipes = await db.select().from(finalRecipes);
  console.log(`Migrazione recipe_components: ${recipes.length} ricette finali...`);

  let rcInserted = 0;
  let rcSkipped = 0;

  for (const recipe of recipes) {
    const comps = parseComponents(recipe.components);
    if (comps.length === 0) continue;

    // Rimuovi eventuali righe già presenti (idempotente)
    await db.delete(recipeComponents).where(eq(recipeComponents.recipeId, recipe.id));

    for (let i = 0; i < comps.length; i++) {
      const comp = comps[i];
      const compType = (comp.type || "").toLowerCase();

      let ingredientId: string | null = null;
      let semiFinishedId: string | null = null;
      let operationId: string | null = null;

      if (compType === "ingredient") {
        if (ingredientIds.has(comp.componentId)) {
          ingredientId = comp.componentId;
        } else {
          console.warn(`  [SKIP] Ricetta ${recipe.name}: ingrediente ${comp.componentId} non trovato`);
          rcSkipped++;
          continue;
        }
      } else if (compType === "semi_finished") {
        if (semiIds.has(comp.componentId)) {
          semiFinishedId = comp.componentId;
        } else {
          console.warn(`  [SKIP] Ricetta ${recipe.name}: semilavorato ${comp.componentId} non trovato`);
          rcSkipped++;
          continue;
        }
      } else if (compType === "operation") {
        operationId = resolveOperationId(comp);
        if (!operationId) {
          console.warn(`  [SKIP] Ricetta ${recipe.name}: operazione "${comp.componentName}" non trovata`);
          rcSkipped++;
          continue;
        }
      } else {
        console.warn(`  [SKIP] Ricetta ${recipe.name}: tipo componente sconosciuto "${comp.type}"`);
        rcSkipped++;
        continue;
      }

      await db.insert(recipeComponents).values({
        id: crypto.randomUUID(),
        recipeId: recipe.id,
        ingredientId,
        semiFinishedId,
        operationId,
        componentName: comp.componentName || comp.name || "",
        quantity: String(comp.quantity ?? 0),
        unitSnapshot: comp.unit ?? null,
        priceSnapshot: comp.pricePerUnit != null ? String(comp.pricePerUnit) : null,
        sortOrder: i,
      } as any);

      rcInserted++;
    }
  }

  console.log(`  → Inseriti: ${rcInserted}, Saltati: ${rcSkipped}`);

  // ── Migra semi_finished_components ────────────────────────────────────────

  const semis = await db.select().from(semiFinishedRecipes);
  console.log(`Migrazione semi_finished_components: ${semis.length} semilavorati...`);

  let sfcInserted = 0;
  let sfcSkipped = 0;

  for (const semi of semis) {
    const comps = parseComponents(semi.components);
    if (comps.length === 0) continue;

    // Rimuovi eventuali righe già presenti (idempotente)
    await db
      .delete(semiFinishedComponents)
      .where(eq(semiFinishedComponents.semiFinishedRecipeId, semi.id));

    for (let i = 0; i < comps.length; i++) {
      const comp = comps[i];
      const compType = (comp.type || "").toLowerCase();

      let ingredientId: string | null = null;
      let childSemiFinishedId: string | null = null;
      let operationId: string | null = null;

      if (compType === "ingredient") {
        if (ingredientIds.has(comp.componentId)) {
          ingredientId = comp.componentId;
        } else {
          console.warn(`  [SKIP] Semi ${semi.name}: ingrediente ${comp.componentId} non trovato`);
          sfcSkipped++;
          continue;
        }
      } else if (compType === "semi_finished") {
        if (semiIds.has(comp.componentId)) {
          childSemiFinishedId = comp.componentId;
        } else {
          console.warn(`  [SKIP] Semi ${semi.name}: semilavorato figlio ${comp.componentId} non trovato`);
          sfcSkipped++;
          continue;
        }
      } else if (compType === "operation") {
        operationId = resolveOperationId(comp);
        if (!operationId) {
          console.warn(`  [SKIP] Semi ${semi.name}: operazione "${comp.componentName}" non trovata`);
          sfcSkipped++;
          continue;
        }
      } else {
        console.warn(`  [SKIP] Semi ${semi.name}: tipo componente sconosciuto "${comp.type}"`);
        sfcSkipped++;
        continue;
      }

      await db.insert(semiFinishedComponents).values({
        id: crypto.randomUUID(),
        semiFinishedRecipeId: semi.id,
        ingredientId,
        childSemiFinishedId,
        operationId,
        componentName: comp.componentName || comp.name || "",
        quantity: String(comp.quantity ?? 0),
        unitSnapshot: comp.unit ?? null,
        priceSnapshot: comp.pricePerUnit != null ? String(comp.pricePerUnit) : null,
        sortOrder: i,
      } as any);

      sfcInserted++;
    }
  }

  console.log(`  → Inseriti: ${sfcInserted}, Saltati: ${sfcSkipped}`);
  console.log("Migrazione completata.");
  await connection.end();
}

main().catch((err) => {
  console.error("Errore migrazione:", err);
  process.exit(1);
});
