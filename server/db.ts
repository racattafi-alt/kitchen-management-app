import { eq, and, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  ingredients,
  semiFinishedRecipes,
  finalRecipes,
  foodMatrix,
  operations,
  weeklyProductions,
  menuTypes,
  menuItems,
  wasteRecords,
  productionBatches,
  haccp,
  cloudStorage,
  Ingredient,
  SemiFinishedRecipe,
  FinalRecipe,
  FoodMatrixItem,
  Operation,
  WeeklyProduction,
  MenuType,
  MenuItem,
  WasteRecord,
  ProductionBatch,
  HACCPRecord,
  CloudStorageFile,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ INGREDIENTI (Livello 0) ============

export async function createIngredient(data: Omit<Ingredient, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ingredients).values(data as any);
  return data;
}

export async function getIngredients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ingredients).where(eq(ingredients.isActive, true));
}

export async function getIngredientById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(ingredients).where(eq(ingredients.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateIngredient(id: string, data: Partial<Ingredient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ingredients).set(data).where(eq(ingredients.id, id));
}

export async function deleteIngredient(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ingredients).set({ isActive: false }).where(eq(ingredients.id, id));
}

// ============ SEMILAVORATI (Livello 1-N) ============

export async function createSemiFinished(data: Omit<SemiFinishedRecipe, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(semiFinishedRecipes).values(data as any);
  return data;
}

export async function getSemiFinishedRecipes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(semiFinishedRecipes);
}

export async function getSemiFinishedById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(semiFinishedRecipes)
    .where(eq(semiFinishedRecipes.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSemiFinished(id: string, data: Partial<SemiFinishedRecipe>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(semiFinishedRecipes).set(data).where(eq(semiFinishedRecipes.id, id));
}

// ============ RICETTE FINALI (Livello 2) ============

export async function createFinalRecipe(data: Omit<FinalRecipe, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(finalRecipes).values(data as any);
  return data;
}

export async function getFinalRecipes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(finalRecipes);
}

export async function getFinalRecipeById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(finalRecipes)
    .where(eq(finalRecipes.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateFinalRecipe(id: string, data: Partial<FinalRecipe>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(finalRecipes).set(data).where(eq(finalRecipes.id, id));
}

// ============ FOOD MATRIX ============

export async function createFoodMatrixItem(data: Omit<FoodMatrixItem, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(foodMatrix).values(data as any);
  return data;
}

export async function getFoodMatrixItems(filters?: { category?: string; tag?: string }) {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(foodMatrix);
  if (filters?.category) {
    query = query.where(eq(foodMatrix.categoryForMenu, filters.category as any));
  }
  if (filters?.tag) {
    query = query.where(eq(foodMatrix.tag, filters.tag as any));
  }
  return query;
}

export async function searchFoodMatrix(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(foodMatrix)
    .where(like(foodMatrix.name, `%${searchTerm}%`));
}

// ============ OPERAZIONI ============

export async function createOperation(data: Omit<Operation, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(operations).values(data as any);
  return data;
}

export async function getOperations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(operations);
}

// ============ PRODUZIONI SETTIMANALI ============

export async function createWeeklyProduction(data: Omit<WeeklyProduction, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(weeklyProductions).values(data as any);
  return data;
}

export async function getWeeklyProductions(weekStartDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(weeklyProductions);
  if (weekStartDate) {
    query = query.where(eq(weeklyProductions.weekStartDate, weekStartDate));
  }
  return query;
}

export async function deleteWeeklyProduction(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(weeklyProductions).where(eq(weeklyProductions.id, id));
  return { success: true };
}

// ============ MENU ============

export async function createMenuType(data: Omit<MenuType, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(menuTypes).values(data as any);
  return data;
}

export async function getMenuTypes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuTypes);
}

export async function createMenuItem(data: Omit<MenuItem, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(menuItems).values(data as any);
  return data;
}

export async function getMenuItems(menuTypeId?: string) {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(menuItems);
  if (menuTypeId) {
    query = query.where(eq(menuItems.menuTypeId, menuTypeId));
  }
  return query;
}

// ============ WASTE MANAGEMENT ============

export async function createWasteRecord(data: Omit<WasteRecord, "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(wasteRecords).values(data as any);
  return data;
}

export async function getWasteRecords(filters?: { componentId?: string; wasteType?: string }) {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(wasteRecords);
  if (filters?.componentId) {
    query = query.where(eq(wasteRecords.componentId, filters.componentId));
  }
  if (filters?.wasteType) {
    query = query.where(eq(wasteRecords.wasteType, filters.wasteType as any));
  }
  return query;
}

// ============ HACCP ============

export async function createProductionBatch(data: Omit<ProductionBatch, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(productionBatches).values(data as any);
  return data;
}

export async function getProductionBatches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productionBatches);
}

export async function createHACCPRecord(data: Omit<HACCPRecord, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(haccp).values(data as any);
  return data;
}

export async function getHACCPRecords() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(haccp);
}

// ============ CLOUD STORAGE ============

export async function createCloudStorageFile(data: Omit<CloudStorageFile, "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(cloudStorage).values(data as any);
  return data;
}

export async function getCloudStorageFiles(filters?: { documentType?: string; relatedEntityId?: string }) {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(cloudStorage);
  if (filters?.documentType) {
    query = query.where(eq(cloudStorage.documentType, filters.documentType as any));
  }
  if (filters?.relatedEntityId) {
    query = query.where(eq(cloudStorage.relatedEntityId, filters.relatedEntityId));
  }
  return query;
}
