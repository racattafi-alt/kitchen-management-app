import { eq, and, desc, like, gte, ne, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  suppliers,
  Supplier,
  InsertSupplier,
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
  orders,
  orderItems,
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
  Order,
  OrderItem,
  recipeVersions,
  RecipeVersion,
  InsertRecipeVersion,
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

export async function getUserOpenIdById(id: number): Promise<string | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ openId: users.openId }).from(users).where(eq(users.id, id)).limit(1);
  return result[0]?.openId;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      loginMethod: users.loginMethod,
      lastSignedIn: users.lastSignedIn,
      createdAt: users.createdAt,
      preferredStoreId: users.preferredStoreId,
    })
    .from(users)
    .orderBy(users.createdAt);
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "manager" | "cook" | "superadmin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ role })
    .where(eq(users.id, userId));
  
  return { success: true };
}

// ============ INGREDIENTI (Livello 0) ============

export async function createIngredient(data: Omit<Ingredient, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ingredients).values(data as any);
  return data;
}

export async function getIngredients(storeId?: string | null) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db
    .select({
      id: ingredients.id,
      name: ingredients.name,
      supplier: ingredients.supplier,
      supplierId: ingredients.supplierId,
      supplierName: suppliers.name,
      category: ingredients.category,
      unitType: ingredients.unitType,
      packageType: ingredients.packageType,
      department: ingredients.department,
      packageQuantity: ingredients.packageQuantity,
      packagePrice: ingredients.packagePrice,
      pricePerKgOrUnit: ingredients.pricePerKgOrUnit,
      minOrderQuantity: ingredients.minOrderQuantity,
      isActive: ingredients.isActive,
      isOrderable: ingredients.isOrderable,
      isSellable: ingredients.isSellable,
      isSoldByPackage: ingredients.isSoldByPackage,
      packageSize: ingredients.packageSize,
      brand: ingredients.brand,
      notes: ingredients.notes,
      isFood: ingredients.isFood,
      allergens: ingredients.allergens,
      createdAt: ingredients.createdAt,
      updatedAt: ingredients.updatedAt,
    })
    .from(ingredients)
    .leftJoin(suppliers, eq(ingredients.supplierId, suppliers.id));
  
  if (storeId) {
    query = query.where(and(eq(ingredients.isActive, true), eq(ingredients.storeId, storeId))) as any;
  } else {
    query = query.where(eq(ingredients.isActive, true)) as any;
  }
  
  const results = await query;
  return results;
}

export async function getIngredientById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: ingredients.id,
      storeId: ingredients.storeId,
      name: ingredients.name,
      supplier: ingredients.supplier,
      supplierId: ingredients.supplierId,
      category: ingredients.category,
      unitType: ingredients.unitType,
      packageType: ingredients.packageType,
      department: ingredients.department,
      packageQuantity: ingredients.packageQuantity,
      packagePrice: ingredients.packagePrice,
      pricePerKgOrUnit: ingredients.pricePerKgOrUnit,
      minOrderQuantity: ingredients.minOrderQuantity,
      brand: ingredients.brand,
      notes: ingredients.notes,
      isActive: ingredients.isActive,
      isFood: ingredients.isFood,
      isOrderable: ingredients.isOrderable,
      isSellable: ingredients.isSellable,
      isSoldByPackage: ingredients.isSoldByPackage,
      isSalaItem: ingredients.isSalaItem,
      subcategory: ingredients.subcategory,
      allergens: ingredients.allergens,
      createdAt: ingredients.createdAt,
      updatedAt: ingredients.updatedAt,
    })
    .from(ingredients)
    .where(eq(ingredients.id, id))
    .limit(1);
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

export async function getSemiFinishedRecipes(storeId?: string | null) {
  const db = await getDb();
  if (!db) return [];
  if (!storeId) {
    return db.select().from(semiFinishedRecipes);
  }
  return db.select().from(semiFinishedRecipes).where(eq(semiFinishedRecipes.storeId, storeId));
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

export async function getFinalRecipes(storeId?: string | null) {
  const db = await getDb();
  if (!db) return [];
  // Filtra solo ricette attive (isActive !== false)
  let query: any = db.select().from(finalRecipes);
  if (storeId) {
    query = query.where(eq(finalRecipes.storeId, storeId));
  }
  const recipes = await query;
  return recipes.filter((r: any) => r.isActive !== false);
}

export async function getAllFinalRecipes() {
  const db = await getDb();
  if (!db) return [];
  // Restituisce TUTTE le ricette (anche nascoste) per gestione
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

export async function getFinalRecipeByCode(code: string, storeId?: string | null) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(finalRecipes)
    .where(
      storeId
        ? and(eq(finalRecipes.code, code), eq(finalRecipes.storeId, storeId))
        : eq(finalRecipes.code, code)
    )
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateFinalRecipe(id: string, data: Partial<FinalRecipe>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(finalRecipes).set(data).where(eq(finalRecipes.id, id));
}

export async function deleteFinalRecipe(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(finalRecipes).where(eq(finalRecipes.id, id));
}

export async function updateProducedQuantity(recipeId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calcola la somma totale delle quantità prodotte per questa ricetta
  const productions = await db
    .select({ quantity: weeklyProductions.quantity })
    .from(weeklyProductions)
    .where(eq(weeklyProductions.recipeFinalId, recipeId));
  
  const totalQuantity = productions.reduce((sum, p) => {
    return sum + (parseFloat(p.quantity?.toString() || '0'));
  }, 0);
  
  // Aggiorna il campo producedQuantity nella ricetta
  await db.update(finalRecipes)
    .set({ producedQuantity: totalQuantity.toString() })
    .where(eq(finalRecipes.id, recipeId));
  
  return totalQuantity;
}

// ============ FOOD MATRIX ============

export async function createFoodMatrixItem(data: Omit<FoodMatrixItem, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(foodMatrix).values(data as any);
  return data;
}

export async function getFoodMatrixItems(storeId?: string | null, filters?: { category?: string; tag?: string }) {
  const db = await getDb();
  if (!db) return [];
  if (!storeId) return [];
  let query: any = db.select().from(foodMatrix).where(eq(foodMatrix.storeId, storeId));
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

export async function getOperationByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(operations).where(eq(operations.name, name));
  return results[0] || null;
}

// ============ PRODUZIONI SETTIMANALI ============

export async function createWeeklyProduction(data: Omit<WeeklyProduction, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(weeklyProductions).values(data as any);
  return data;
}

export async function getWeeklyProductions(weekStartDate?: Date, storeId?: string | null) {
  const db = await getDb();
  if (!db) return [];
  
  let query: any = db
    .select({
      id: weeklyProductions.id,
      weekStartDate: weeklyProductions.weekStartDate,
      productionType: weeklyProductions.productionType,
      recipeFinalId: weeklyProductions.recipeFinalId,
      semiFinishedId: weeklyProductions.semiFinishedId,
      quantity: weeklyProductions.quantity,
      createdAt: weeklyProductions.createdAt,
      updatedAt: weeklyProductions.updatedAt,
      recipeName: finalRecipes.name,
      recipeCode: finalRecipes.code,
      measurementType: finalRecipes.measurementType,
      pieceWeight: finalRecipes.pieceWeight,
    })
    .from(weeklyProductions)
    .leftJoin(finalRecipes, eq(weeklyProductions.recipeFinalId, finalRecipes.id));
  
  const conditions: any[] = [];

  if (storeId) {
    conditions.push(eq(weeklyProductions.storeId, storeId));
  }

  if (weekStartDate) {
    conditions.push(eq(weeklyProductions.weekStartDate, weekStartDate));
  } else {
    // Senza filtro settimana: mostra produzioni dalla settimana corrente in poi
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=domenica, 1=lunedì...
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + diff);
    thisMonday.setHours(0, 0, 0, 0);
    conditions.push(gte(weeklyProductions.weekStartDate, thisMonday));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return query;
}

export async function deleteWeeklyProduction(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Recupera recipeFinalId prima di eliminare
  const production = await db
    .select({ recipeFinalId: weeklyProductions.recipeFinalId })
    .from(weeklyProductions)
    .where(eq(weeklyProductions.id, id))
    .limit(1);
  
  await db.delete(weeklyProductions).where(eq(weeklyProductions.id, id));
  
  return { 
    success: true, 
    recipeFinalId: production[0]?.recipeFinalId || null 
  };
}

// ============ MENU ============

export async function createMenuType(data: Omit<MenuType, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(menuTypes).values(data as any);
  return data;
}

export async function getMenuTypes(storeId?: string | null) {
  const db = await getDb();
  if (!db) return [];
  if (!storeId) return [];
  return db.select().from(menuTypes).where(eq(menuTypes.storeId, storeId));
}

export async function createMenuItem(data: Omit<MenuItem, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(menuItems).values(data as any);
  return data;
}

export async function getMenuItems(storeId?: string | null, menuTypeId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (!storeId) return [];
  let query: any = db.select().from(menuItems).where(eq(menuItems.storeId, storeId));
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

export async function getWasteRecords(storeId?: string | null, filters?: { componentId?: string; wasteType?: string }) {
  const db = await getDb();
  if (!db) return [];
  if (!storeId) return [];
  let query: any = db.select().from(wasteRecords).where(eq(wasteRecords.storeId, storeId));
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

export async function getProductionBatches(storeId?: string | null) {
  const db = await getDb();
  if (!db) return [];
  if (!storeId) return [];
  return db.select().from(productionBatches).where(eq(productionBatches.storeId, storeId));
}

export async function createHACCPRecord(data: Omit<HACCPRecord, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(haccp).values(data as any);
  return data;
}

export async function getHACCPRecords(storeId?: string | null) {
  const db = await getDb();
  if (!db) return [];
  if (!storeId) return [];
  return db.select().from(haccp).where(eq(haccp.storeId, storeId));
}

// ============ CLOUD STORAGE ============

export async function createCloudStorageFile(data: Omit<CloudStorageFile, "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(cloudStorage).values(data as any);
  return data;
}

export async function getCloudStorageFiles(storeId?: string | null, filters?: { documentType?: string; relatedEntityId?: string }) {
  const db = await getDb();
  if (!db) return [];
  if (!storeId) return [];
  let query: any = db.select().from(cloudStorage).where(eq(cloudStorage.storeId, storeId));
  if (filters?.documentType) {
    query = query.where(eq(cloudStorage.documentType, filters.documentType as any));
  }
  if (filters?.relatedEntityId) {
    query = query.where(eq(cloudStorage.relatedEntityId, filters.relatedEntityId));
  }
  return query;
}

// ============ SUPPLIERS (FORNITORI) ============

export async function getSuppliers(storeId?: string | null) {
  const db = await getDb();
  if (!db) return [];
  if (storeId) {
    return db.select().from(suppliers).where(eq(suppliers.storeId, storeId));
  }
  return db.select().from(suppliers);
}

export async function createSupplier(data: Omit<Supplier, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(suppliers).values(data as any);
  return data;
}

export async function updateSupplier(id: string, data: Partial<Supplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data as any).where(eq(suppliers.id, id));
  return { id, ...data };
}

export async function deleteSupplier(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(suppliers).where(eq(suppliers.id, id));
  return { id };
}

// ============ ORDERS (STORICO ORDINI) ============

export async function createOrder(data: Omit<Order, "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(orders).values(data as any);
  return data;
}

export async function createOrderItem(data: Omit<OrderItem, "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(orderItems).values(data as any);
  return data;
}

export async function getOrders(filters?: { weekId?: string; limit?: number; storeId?: string | null }) {
  const db = await getDb();
  if (!db) return [];
  let query: any = db.select().from(orders).orderBy(desc(orders.orderDate));
  
  const conditions = [];
  if (filters?.weekId) {
    conditions.push(eq(orders.weekId, filters.weekId));
  }
  if (filters?.storeId) {
    conditions.push(eq(orders.storeId, filters.storeId));
  }
  if (conditions.length > 0) {
    query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  return query;
}

export async function getOrderItems(orderId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

// ============ RECIPE VERSIONS (STORICO VERSIONI) ============

export async function createRecipeVersion(data: Omit<RecipeVersion, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(recipeVersions).values(data as any);
  return data;
}

export async function getLastRecipeVersion(recipeId: string, recipeType: "final" | "semifinished") {
  const db = await getDb();
  if (!db) return null;
  const results = await db
    .select()
    .from(recipeVersions)
    .where(and(eq(recipeVersions.recipeId, recipeId), eq(recipeVersions.recipeType, recipeType)))
    .orderBy(desc(recipeVersions.versionNumber))
    .limit(1);
  return results.length > 0 ? results[0] : null;
}

export async function getRecipeVersions(recipeId: string, recipeType: "final" | "semifinished") {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(recipeVersions)
    .where(and(eq(recipeVersions.recipeId, recipeId), eq(recipeVersions.recipeType, recipeType)))
    .orderBy(desc(recipeVersions.versionNumber));
}

// ============ LOCAL AUTH HELPERS ============

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateUserPasswordHash(userId: number, hash: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, userId));
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(users);
  return result.length;
}

export async function deduplicateIngredients(): Promise<{ removed: number; details: string[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Trova tutti gli ingredienti raggruppati per (storeId, nome normalizzato)
  const allIngredients = await db
    .select({ id: ingredients.id, storeId: ingredients.storeId, name: ingredients.name, createdAt: ingredients.createdAt })
    .from(ingredients)
    .orderBy(ingredients.storeId, ingredients.name, ingredients.createdAt);

  // Raggruppa per storeId + nome (case-insensitive)
  const groups = new Map<string, typeof allIngredients>();
  for (const ing of allIngredients) {
    const key = `${ing.storeId}::${ing.name.toLowerCase().trim()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ing);
  }

  const toDelete: string[] = [];
  const details: string[] = [];

  for (const [key, group] of Array.from(groups.entries())) {
    if (group.length <= 1) continue;
    // Mantieni il più vecchio (primo creato), elimina gli altri
    const [keep, ...duplicates] = group;
    for (const dup of duplicates) {
      toDelete.push(dup.id);
    }
    const storePart = key.split('::')[0];
    details.push(`[${storePart}] "${group[0].name}": mantenuto ${keep.id}, rimossi ${duplicates.map((d: { id: string }) => d.id).join(', ')}`);
  }

  if (toDelete.length > 0) {
    // Prima aggiorna le ricette che usano gli id duplicati con l'id del mantenuto
    // (le ricette memorizzano i componenti come JSON, non come FK, quindi i riferimenti rimangono validi)
    // Elimina i duplicati
    await db.delete(ingredients).where(inArray(ingredients.id, toDelete));
  }

  return { removed: toDelete.length, details };
}
