import { getDb } from "./db.js";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { 
  ingredients, 
  finalRecipes,
  suppliers 
} from "../drizzle/schema.js";

export type EntityType = "ingredient" | "recipe" | "supplier";

/**
 * INGREDIENTI - Recupera ingrediente da tutti gli store per nome
 */
export async function getIngredientAcrossStores(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.name, name));
  
  return results;
}

/**
 * INGREDIENTI - Aggiorna ingrediente in store specifici
 */
export async function updateIngredientAcrossStores(
  name: string,
  data: Partial<typeof ingredients.$inferInsert>,
  storeIds: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates = [];
  
  for (const storeId of storeIds) {
    const existing = await db
      .select()
      .from(ingredients)
      .where(and(
        eq(ingredients.name, name),
        eq(ingredients.storeId, storeId)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      // Aggiorna esistente
      await db
        .update(ingredients)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(ingredients.id, existing[0].id));
      
      updates.push({ storeId, action: "updated" as const, id: existing[0].id });
    } else {
      // Crea nuovo
      const newId = randomUUID();
      await db
        .insert(ingredients)
        .values({ ...data, id: newId, storeId, name } as any);
      
      updates.push({ storeId, action: "created" as const, id: newId });
    }
  }
  
  return updates;
}

/**
 * RICETTE - Recupera ricetta da tutti gli store per nome
 */
export async function getRecipeAcrossStores(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select()
    .from(finalRecipes)
    .where(eq(finalRecipes.name, name));
  
  return results;
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
      // Aggiorna esistente
      await db
        .update(finalRecipes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(finalRecipes.id, existing[0].id));
      
      updates.push({ storeId, action: "updated" as const, id: existing[0].id });
    } else {
      // Crea nuovo
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
 * FORNITORI - Recupera fornitore da tutti gli store per nome
 */
export async function getSupplierAcrossStores(name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.name, name));
  
  return results;
}

/**
 * FORNITORI - Aggiorna fornitore in store specifici
 */
export async function updateSupplierAcrossStores(
  name: string,
  data: Partial<typeof suppliers.$inferInsert>,
  storeIds: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates = [];
  
  for (const storeId of storeIds) {
    const existing = await db
      .select()
      .from(suppliers)
      .where(and(
        eq(suppliers.name, name),
        eq(suppliers.storeId, storeId)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      // Aggiorna esistente
      await db
        .update(suppliers)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(suppliers.id, existing[0].id));
      
      updates.push({ storeId, action: "updated" as const, id: existing[0].id });
    } else {
      // Crea nuovo
      const newId = randomUUID();
      await db
        .insert(suppliers)
        .values({ ...data, id: newId, storeId, name } as any);
      
      updates.push({ storeId, action: "created" as const, id: newId });
    }
  }
  
  return updates;
}

/**
 * Lista tutti gli ingredienti aggregati per nome
 */
export async function listIngredientsGrouped() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select()
    .from(ingredients)
    .orderBy(ingredients.name);
  
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
      return db.select().from(ingredients).where(eq(ingredients.storeId, storeId));
    case "recipe":
      return db.select().from(finalRecipes).where(eq(finalRecipes.storeId, storeId));
    case "supplier":
      return db.select().from(suppliers).where(eq(suppliers.storeId, storeId));
  }
}

/**
 * Confronta entità tra due store: restituisce cosa c'è solo in A, solo in B, e in entrambi (con flag diff)
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
 * Lista tutti i fornitori aggregati per nome
 */
export async function listSuppliersGrouped() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select()
    .from(suppliers)
    .orderBy(suppliers.name);
  
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
