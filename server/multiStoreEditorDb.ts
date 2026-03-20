import { getDb } from "./db.js";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  ingredients,
  ingredientStores,
  finalRecipes,
  suppliers
} from "../drizzle/schema.js";

export type EntityType = "ingredient" | "recipe" | "supplier";

/**
 * INGREDIENTI - Recupera ingrediente per nome (globale)
 */
export async function getIngredientAcrossStores(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(ingredients)
    .where(eq(ingredients.name, name));
}

/**
 * INGREDIENTI - Aggiorna il record globale e attiva/crea nelle junction per gli store specificati.
 * Con il nuovo modello l'ingrediente è un'unica entità globale; questa funzione
 * aggiorna i dati e assicura che sia attivo in tutti gli store richiesti.
 */
export async function updateIngredientAcrossStores(
  name: string,
  data: Partial<typeof ingredients.$inferInsert>,
  storeIds: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.name, name))
    .limit(1);

  let ingredientId: string;

  if (existing.length > 0) {
    // Aggiorna record globale esistente
    await db
      .update(ingredients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ingredients.id, existing[0].id));
    ingredientId = existing[0].id;
  } else {
    // Crea nuovo record globale
    ingredientId = randomUUID();
    await db
      .insert(ingredients)
      .values({ ...data, id: ingredientId, name } as any);
  }

  // Attiva nelle junction degli store richiesti
  const updates = [];
  for (const storeId of storeIds) {
    await db
      .insert(ingredientStores)
      .values({ ingredientId, storeId, isActive: true })
      .onDuplicateKeyUpdate({ set: { isActive: true } });
    updates.push({ storeId, action: existing.length > 0 ? "updated" as const : "created" as const, id: ingredientId });
  }

  return updates;
}

/**
 * RICETTE - Recupera ricetta da tutti gli store per nome
 */
export async function getRecipeAcrossStores(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(finalRecipes)
    .where(eq(finalRecipes.name, name));
}

/**
 * RICETTE - Aggiorna ricetta in store specifici
 */
export async function updateRecipeAcrossStores(
  name: string,
  data: Partial<typeof finalRecipes.$inferInsert>,
  storeIds: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates = [];

  for (const storeId of storeIds) {
    const existing = await db
      .select()
      .from(finalRecipes)
      .where(and(
        eq(finalRecipes.name, name),
        eq(finalRecipes.storeId, storeId)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(finalRecipes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(finalRecipes.id, existing[0].id));

      updates.push({ storeId, action: "updated" as const, id: existing[0].id });
    } else {
      const newId = randomUUID();
      await db
        .insert(finalRecipes)
        .values({ ...data, id: newId, storeId, name } as any);

      updates.push({ storeId, action: "created" as const, id: newId });
    }
  }

  return updates;
}

/**
 * FORNITORI - Recupera fornitore per nome (globale)
 */
export async function getSupplierAcrossStores(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(suppliers)
    .where(eq(suppliers.name, name));
}

/**
 * FORNITORI - Aggiorna fornitore globale.
 * I fornitori sono ora un database globale (non per store), quindi si aggiorna
 * o crea un unico record.
 */
export async function updateSupplierAcrossStores(
  name: string,
  data: Partial<typeof suppliers.$inferInsert>,
  _storeIds: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.name, name))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(suppliers.id, existing[0].id));
    return [{ action: "updated" as const, id: existing[0].id }];
  } else {
    const newId = randomUUID();
    await db
      .insert(suppliers)
      .values({ ...data, id: newId, name } as any);
    return [{ action: "created" as const, id: newId }];
  }
}

/**
 * Lista tutti gli ingredienti (globali) con informazioni sugli store attivi
 */
export async function listIngredientsGrouped() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select()
    .from(ingredients)
    .orderBy(ingredients.name);

  // Recupera le junction per ogni ingrediente
  const junctions = await db.select().from(ingredientStores);
  const storesByIngredient: Record<string, string[]> = {};
  for (const j of junctions) {
    if (j.isActive) {
      if (!storesByIngredient[j.ingredientId]) storesByIngredient[j.ingredientId] = [];
      storesByIngredient[j.ingredientId].push(j.storeId);
    }
  }

  return results.map((i: any) => ({
    name: i.name,
    id: i.id,
    storeCount: (storesByIngredient[i.id] || []).length,
    stores: storesByIngredient[i.id] || [],
  }));
}

/**
 * Lista tutte le ricette aggregate per nome
 */
export async function listRecipesGrouped() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select()
    .from(finalRecipes)
    .orderBy(finalRecipes.name);

  const grouped: Record<string, any[]> = {};
  for (const entity of results) {
    if (!grouped[entity.name]) {
      grouped[entity.name] = [];
    }
    grouped[entity.name].push(entity);
  }

  return Object.entries(grouped).map(([name, entities]) => ({
    name,
    storeCount: entities.length,
    stores: entities.map((e: any) => e.storeId),
  }));
}

/**
 * Recupera tutte le entità di un tipo da uno store specifico
 */
export async function getAllEntitiesFromStore(entityType: EntityType, storeId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  switch (entityType) {
    case "ingredient":
      // Ingredienti globali attivi nello store tramite junction
      return db
        .select({ ingredient: ingredients })
        .from(ingredients)
        .innerJoin(ingredientStores, eq(ingredientStores.ingredientId, ingredients.id))
        .where(and(
          eq(ingredientStores.storeId, storeId),
          eq(ingredientStores.isActive, true),
        ))
        .then((rows) => rows.map((r) => r.ingredient));
    case "recipe":
      return db.select().from(finalRecipes).where(eq(finalRecipes.storeId, storeId));
    case "supplier":
      // Fornitori sono globali, ritorna tutti
      return db.select().from(suppliers);
  }
}

/**
 * Confronta entità tra due store
 */
export async function compareStoreEntities(
  entityType: EntityType,
  storeIdA: string,
  storeIdB: string
) {
  const [entitiesA, entitiesB] = await Promise.all([
    getAllEntitiesFromStore(entityType, storeIdA),
    getAllEntitiesFromStore(entityType, storeIdB),
  ]);

  const mapA = new Map(entitiesA.map((e: any) => [e.name, e]));
  const mapB = new Map(entitiesB.map((e: any) => [e.name, e]));

  const COMPARE_FIELDS_BY_TYPE: Record<EntityType, string[]> = {
    ingredient: ["category", "unitType", "packageType", "department", "packageQuantity", "packagePrice", "pricePerKgOrUnit", "minOrderQuantity", "packageSize", "brand", "notes"],
    recipe: ["category", "yieldPercentage", "totalCost", "conservationMethod", "maxConservationTime", "serviceWastePercentage", "unitType", "unitWeight", "producedQuantity", "isSellable", "isActive"],
    supplier: ["contact", "email", "phone", "address", "notes"],
  };

  const compareFields = COMPARE_FIELDS_BY_TYPE[entityType];

  const onlyInA = entitiesA
    .filter((e: any) => !mapB.has(e.name))
    .map((e: any) => e.name);

  const onlyInB = entitiesB
    .filter((e: any) => !mapA.has(e.name))
    .map((e: any) => e.name);

  const inBoth = entitiesA
    .filter((e: any) => mapB.has(e.name))
    .map((e: any) => {
      const b = mapB.get(e.name)!;
      const hasDiff = compareFields.some(
        (f) => String((e as any)[f] ?? "") !== String((b as any)[f] ?? "")
      );
      return { name: e.name, hasDiff };
    });

  return { onlyInA, onlyInB, inBoth };
}

/**
 * Lista tutti i fornitori (database globale)
 */
export async function listSuppliersGrouped() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select()
    .from(suppliers)
    .orderBy(suppliers.name);

  return results.map((s: any) => ({
    name: s.name,
    id: s.id,
    storeCount: null, // fornitori globali, non legati a store
    stores: [],
  }));
}
