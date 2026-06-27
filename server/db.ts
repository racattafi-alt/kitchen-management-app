import * as crypto from "crypto";
import { eq, and, desc, like, gte, ne, sql, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  suppliers,
  Supplier,
  InsertSupplier,
  ingredients,
  ingredientStores,
  IngredientStore,
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
  recipeComponents,
  semiFinishedComponents,
  InsertRecipeComponent,
  InsertSemiFinishedComponent,
  InsertSemiFinishedRecipe,
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

/**
 * Crea un ingrediente globale e lo attiva opzionalmente in uno store.
 * Idempotente: se esiste già un ingrediente con lo stesso nome+fornitore,
 * riusa il record esistente e aggiorna lo store senza fallire.
 */
export async function createIngredient(
  data: Omit<Ingredient, "createdAt" | "updatedAt">,
  storeId?: string | null,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check se esiste già (stesso nome + stesso fornitore)
  const existingFilter = data.supplierId
    ? and(eq(ingredients.name, data.name), eq(ingredients.supplierId, data.supplierId))
    : and(eq(ingredients.name, data.name), isNull(ingredients.supplierId));
  const existing = await db
    .select({ id: ingredients.id })
    .from(ingredients)
    .where(existingFilter)
    .limit(1);

  const ingredientId = existing.length > 0 ? existing[0].id : data.id;

  if (existing.length === 0) {
    try {
      await db.insert(ingredients).values(data as any);
    } catch (insertErr: any) {
      const cause = insertErr?.cause;
      console.error("[createIngredient] INSERT FAILED:", {
        code: insertErr?.code ?? cause?.code,
        errno: insertErr?.errno ?? cause?.errno,
        sqlState: cause?.sqlState,
        sqlMessage: insertErr?.sqlMessage ?? cause?.sqlMessage,
        causeMessage: cause?.message,
        dataKeys: Object.keys(data || {}),
      });
      // Se l'errore è un duplicate entry su UNIQUE(name, supplierId), trattalo come successo idempotente
      const errCode = insertErr?.code ?? cause?.code;
      const errNo = insertErr?.errno ?? cause?.errno;
      if (errCode === "ER_DUP_ENTRY" || errNo === 1062) {
        console.warn("[createIngredient] duplicate entry — treating as success (idempotent)");
      } else {
        // Rilancia con messaggio più esplicito
        const detail = cause?.sqlMessage || cause?.message || insertErr?.message || "unknown";
        throw new Error(`INSERT ingredienti fallito: ${detail}`);
      }
    }
  }

  if (storeId) {
    try {
      await db.insert(ingredientStores)
        .values({ ingredientId, storeId, isActive: true })
        .onDuplicateKeyUpdate({ set: { isActive: true } });
    } catch (storeErr: any) {
      // ingredient_stores potrebbe non esistere ancora (migration pendente)
      console.warn("[createIngredient] ingredient_stores insert failed:", storeErr?.message);
    }
  }
  return { ...data, id: ingredientId };
}

/**
 * Ritorna tutti gli ingredienti globalmente attivi.
 * Se storeId è fornito, filtra solo quelli attivati per quello store (via ingredient_stores).
 */
export async function getIngredients(storeId?: string | null) {
  const db = await getDb();
  if (!db) return [];

  const baseSelect = {
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
    piecesPerBox: ingredients.piecesPerBox,
    packageSize: ingredients.packageSize,
    brand: ingredients.brand,
    notes: ingredients.notes,
    isFood: ingredients.isFood,
    allergens: ingredients.allergens,
    createdAt: ingredients.createdAt,
    updatedAt: ingredients.updatedAt,
  };

  if (storeId) {
    return db
      .select(baseSelect)
      .from(ingredients)
      .innerJoin(ingredientStores, eq(ingredientStores.ingredientId, ingredients.id))
      .leftJoin(suppliers, eq(ingredients.supplierId, suppliers.id))
      .where(
        and(
          eq(ingredientStores.storeId, storeId),
          eq(ingredientStores.isActive, true),
          eq(ingredients.isActive, true),
        ),
      );
  }

  return db
    .select(baseSelect)
    .from(ingredients)
    .leftJoin(suppliers, eq(ingredients.supplierId, suppliers.id))
    .where(eq(ingredients.isActive, true));
}

export async function getIngredientById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: ingredients.id,
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
      piecesPerBox: ingredients.piecesPerBox,
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

/**
 * Disattiva globalmente un ingrediente (isActive = false).
 */
export async function deleteIngredient(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(ingredients).set({ isActive: false }).where(eq(ingredients.id, id));
}

/**
 * Attiva un ingrediente in uno store specifico (upsert in ingredient_stores).
 */
export async function activateIngredientInStore(ingredientId: string, storeId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(ingredientStores)
    .values({ ingredientId, storeId, isActive: true })
    .onDuplicateKeyUpdate({ set: { isActive: true } });
}

/**
 * Disattiva un ingrediente da uno store specifico.
 * L'ingrediente rimane visibile in altri store e nel database globale.
 */
export async function deactivateIngredientInStore(ingredientId: string, storeId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(ingredientStores)
    .set({ isActive: false })
    .where(and(eq(ingredientStores.ingredientId, ingredientId), eq(ingredientStores.storeId, storeId)));
}

/**
 * Ritorna la lista degli store in cui un ingrediente è attivo.
 */
export async function getIngredientStores(ingredientId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ingredientStores)
    .where(eq(ingredientStores.ingredientId, ingredientId));
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

export async function deleteSemiFinished(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(semiFinishedComponents).where(eq(semiFinishedComponents.semiFinishedRecipeId, id));
  await db.delete(semiFinishedRecipes).where(eq(semiFinishedRecipes.id, id));
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

// ============ SUPPLIERS (FORNITORI) — database globale ============

/**
 * Ritorna tutti i fornitori (database globale, storeId ignorato per compatibilità).
 */
export async function getSuppliers(_storeId?: string | null) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(suppliers).orderBy(suppliers.name);
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

  // Trova tutti gli ingredienti raggruppati per (name + supplierId)
  const allIngredients = await db
    .select({ id: ingredients.id, supplierId: ingredients.supplierId, name: ingredients.name, createdAt: ingredients.createdAt })
    .from(ingredients)
    .orderBy(ingredients.name, ingredients.createdAt);

  // Raggruppa per nome + supplierId (case-insensitive)
  const groups = new Map<string, typeof allIngredients>();
  for (const ing of allIngredients) {
    const key = `${ing.name.toLowerCase().trim()}::${ing.supplierId ?? ""}`;
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
    details.push(`"${group[0].name}": mantenuto ${keep.id}, rimossi ${duplicates.map((d: { id: string }) => d.id).join(', ')}`);
  }

  if (toDelete.length > 0) {
    // Prima aggiorna le ricette che usano gli id duplicati con l'id del mantenuto
    // (le ricette memorizzano i componenti come JSON, non come FK, quindi i riferimenti rimangono validi)
    // Elimina i duplicati
    await db.delete(ingredients).where(inArray(ingredients.id, toDelete));
  }

  return { removed: toDelete.length, details };
}

// ============ COMPONENTI RELAZIONALI (Soluzione D) ============

/**
 * Tipo normalizzato restituito dalle query sui componenti relazionali.
 * Unifica ingrediente / semilavorato / operazione in un'unica struttura.
 */
export type RelationalComponent = {
  id: string;
  type: "ingredient" | "semi_finished" | "operation";
  componentId: string;
  componentName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  costType?: string;
  sortOrder: number;
};

/**
 * Tipo di input per creare/aggiornare un componente.
 */
export type ComponentInput = {
  type: "ingredient" | "semi_finished" | "operation";
  componentId: string;
  componentName: string;
  quantity: number;
  unit: string;
  pricePerUnit?: number;
  costType?: string;
};

/** Converte un blob JSON di componenti (formato legacy) nel formato RelationalComponent. */
function parseJsonBlobComponents(blob: unknown): RelationalComponent[] {
  const arr = Array.isArray(blob) ? blob : (() => { try { return JSON.parse(blob as string); } catch { return []; } })();
  if (!Array.isArray(arr)) return [];
  return arr.map((c: any, i: number) => ({
    id: c.id || `blob-${i}`,
    type: c.type || 'ingredient',
    componentId: c.componentId || c.id || '',
    componentName: c.componentName || c.name || 'Sconosciuto',
    quantity: parseFloat(c.quantity ?? 0),
    unit: c.unit || 'kg',
    pricePerUnit: parseFloat(c.pricePerUnit ?? 0),
    sortOrder: c.sortOrder ?? i,
    costType: c.costType,
  }));
}

/** Arricchisce componenti blob JSON con prezzi aggiornati dal database. */
async function enrichBlobWithLivePrices(comps: RelationalComponent[]): Promise<RelationalComponent[]> {
  const db = await getDb();
  if (!db || comps.length === 0) return comps;
  return Promise.all(comps.map(async (comp) => {
    if (comp.type === 'ingredient' && comp.componentId) {
      const [row] = await db.select({ price: ingredients.pricePerKgOrUnit, name: ingredients.name })
        .from(ingredients).where(eq(ingredients.id, comp.componentId)).limit(1);
      if (row) return {
        ...comp,
        componentName: row.name || comp.componentName,
        pricePerUnit: parseFloat((row.price ?? comp.pricePerUnit) as any),
      };
    }
    if (comp.type === 'semi_finished' && comp.componentId) {
      const [row] = await db.select({ price: semiFinishedRecipes.finalPricePerKg, name: semiFinishedRecipes.name })
        .from(semiFinishedRecipes).where(eq(semiFinishedRecipes.id, comp.componentId)).limit(1);
      if (row) return {
        ...comp,
        componentName: row.name || comp.componentName,
        pricePerUnit: parseFloat((row.price ?? comp.pricePerUnit) as any),
      };
    }
    if (comp.type === 'operation' && comp.componentId) {
      const [row] = await db.select({ rate: operations.hourlyRate, name: operations.name })
        .from(operations).where(eq(operations.id, comp.componentId)).limit(1);
      if (row) return {
        ...comp,
        componentName: row.name || comp.componentName,
        pricePerUnit: parseFloat((row.rate ?? comp.pricePerUnit) as any),
      };
    }
    return comp;
  }));
}

export async function getRecipeComponents(recipeId: string): Promise<RelationalComponent[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db
      .select({
        id: recipeComponents.id,
        ingredientId: recipeComponents.ingredientId,
        semiFinishedId: recipeComponents.semiFinishedId,
        operationId: recipeComponents.operationId,
        componentName: recipeComponents.componentName,
        quantity: recipeComponents.quantity,
        unitSnapshot: recipeComponents.unitSnapshot,
        priceSnapshot: recipeComponents.priceSnapshot,
        sortOrder: recipeComponents.sortOrder,
        ingName: ingredients.name,
        ingPrice: ingredients.pricePerKgOrUnit,
        ingUnit: ingredients.unitType,
        semiName: semiFinishedRecipes.name,
        semiPrice: semiFinishedRecipes.finalPricePerKg,
        opName: operations.name,
        opRate: operations.hourlyRate,
        opCostType: operations.costType,
      })
      .from(recipeComponents)
      .leftJoin(ingredients, eq(recipeComponents.ingredientId, ingredients.id))
      .leftJoin(semiFinishedRecipes, eq(recipeComponents.semiFinishedId, semiFinishedRecipes.id))
      .leftJoin(operations, eq(recipeComponents.operationId, operations.id))
      .where(eq(recipeComponents.recipeId, recipeId))
      .orderBy(recipeComponents.sortOrder);

    const mapped: RelationalComponent[] = rows.map((r) => {
      if (r.ingredientId) {
        return {
          id: r.id,
          type: "ingredient" as const,
          componentId: r.ingredientId,
          componentName: r.ingName || r.componentName || 'Sconosciuto',
          quantity: parseFloat(r.quantity as any),
          unit: r.unitSnapshot || (r.ingUnit === "u" ? "unità" : "kg"),
          pricePerUnit: parseFloat((r.ingPrice ?? r.priceSnapshot ?? "0") as any),
          sortOrder: r.sortOrder,
        };
      }
      if (r.semiFinishedId) {
        return {
          id: r.id,
          type: "semi_finished" as const,
          componentId: r.semiFinishedId,
          componentName: r.semiName || r.componentName || 'Sconosciuto',
          quantity: parseFloat(r.quantity as any),
          unit: r.unitSnapshot || "kg",
          pricePerUnit: parseFloat((r.semiPrice ?? r.priceSnapshot ?? "0") as any),
          sortOrder: r.sortOrder,
        };
      }
      if (r.operationId) {
        return {
          id: r.id,
          type: "operation" as const,
          componentId: r.operationId,
          componentName: r.opName || r.componentName || 'Sconosciuto',
          quantity: parseFloat(r.quantity as any),
          unit: r.unitSnapshot || "ore",
          pricePerUnit: parseFloat((r.opRate ?? r.priceSnapshot ?? "0") as any),
          costType: r.opCostType || undefined,
          sortOrder: r.sortOrder,
        };
      }
      // Tutti gli ID NULL → componente "pending" (non collegato).
      // Manteniamo il nome inserito dal TSV/utente; type default "ingredient"
      // perché è il caso più comune e permette al form di riconoscerlo.
      return {
        id: r.id,
        type: "ingredient" as const,
        componentId: "",
        componentName: r.componentName || '(senza nome)',
        quantity: parseFloat(r.quantity as any),
        unit: r.unitSnapshot || "kg",
        pricePerUnit: parseFloat((r.priceSnapshot ?? "0") as any),
        sortOrder: r.sortOrder,
      };
    });

    if (mapped.length === 0) {
      const recipe = await getFinalRecipeById(recipeId);
      if (recipe?.components) return enrichBlobWithLivePrices(parseJsonBlobComponents(recipe.components));
    }

    return mapped;
  } catch {
    // Tabella non esiste o query fallita: fallback al blob JSON
    const recipe = await getFinalRecipeById(recipeId);
    if (recipe?.components) return enrichBlobWithLivePrices(parseJsonBlobComponents(recipe.components));
    return [];
  }
}

/** Sostituisce tutti i componenti di una ricetta finale (delete + bulk insert). */
export async function setRecipeComponents(recipeId: string, comps: ComponentInput[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(recipeComponents).where(eq(recipeComponents.recipeId, recipeId));

  if (comps.length === 0) return;

  const rows: InsertRecipeComponent[] = comps.map((c, i) => {
    // Se componentId è vuoto → componente "pending" (tutti gli ID a NULL,
    // preserviamo il componentName per non perdere il riferimento).
    const hasId = !!c.componentId;
    return {
      id: crypto.randomUUID(),
      recipeId,
      ingredientId: hasId && c.type === "ingredient" ? c.componentId : null,
      semiFinishedId: hasId && c.type === "semi_finished" ? c.componentId : null,
      operationId: hasId && c.type === "operation" ? c.componentId : null,
      componentName: c.componentName || '(senza nome)',
      quantity: String(c.quantity),
      unitSnapshot: c.unit || null,
      priceSnapshot: c.pricePerUnit != null ? String(c.pricePerUnit) : null,
      sortOrder: i,
    };
  });

  await db.insert(recipeComponents).values(rows as any);
}

/** Restituisce i componenti di un semilavorato con una singola JOIN. */
export async function getSemiFinishedComponentsRelational(semiFinishedId: string): Promise<RelationalComponent[]> {
  const db = await getDb();
  if (!db) return [];

  const childSemi = semiFinishedRecipes;

  try {
    const rows = await db
      .select({
        id: semiFinishedComponents.id,
        ingredientId: semiFinishedComponents.ingredientId,
        childSemiFinishedId: semiFinishedComponents.childSemiFinishedId,
        operationId: semiFinishedComponents.operationId,
        componentName: semiFinishedComponents.componentName,
        quantity: semiFinishedComponents.quantity,
        unitSnapshot: semiFinishedComponents.unitSnapshot,
        priceSnapshot: semiFinishedComponents.priceSnapshot,
        sortOrder: semiFinishedComponents.sortOrder,
        ingName: ingredients.name,
        ingPrice: ingredients.pricePerKgOrUnit,
        ingUnit: ingredients.unitType,
        semiName: childSemi.name,
        semiPrice: childSemi.finalPricePerKg,
        opName: operations.name,
        opRate: operations.hourlyRate,
        opCostType: operations.costType,
      })
      .from(semiFinishedComponents)
      .leftJoin(ingredients, eq(semiFinishedComponents.ingredientId, ingredients.id))
      .leftJoin(childSemi, eq(semiFinishedComponents.childSemiFinishedId, childSemi.id))
      .leftJoin(operations, eq(semiFinishedComponents.operationId, operations.id))
      .where(eq(semiFinishedComponents.semiFinishedRecipeId, semiFinishedId))
      .orderBy(semiFinishedComponents.sortOrder);

    const mapped: RelationalComponent[] = rows.map((r) => {
      if (r.ingredientId) {
        return {
          id: r.id,
          type: "ingredient" as const,
          componentId: r.ingredientId,
          componentName: r.ingName || r.componentName || 'Sconosciuto',
          quantity: parseFloat(r.quantity as any),
          unit: r.unitSnapshot || (r.ingUnit === "u" ? "unità" : "kg"),
          pricePerUnit: parseFloat((r.ingPrice ?? r.priceSnapshot ?? "0") as any),
          sortOrder: r.sortOrder,
        };
      }
      if (r.childSemiFinishedId) {
        return {
          id: r.id,
          type: "semi_finished" as const,
          componentId: r.childSemiFinishedId,
          componentName: r.semiName || r.componentName || 'Sconosciuto',
          quantity: parseFloat(r.quantity as any),
          unit: r.unitSnapshot || "kg",
          pricePerUnit: parseFloat((r.semiPrice ?? r.priceSnapshot ?? "0") as any),
          sortOrder: r.sortOrder,
        };
      }
      if (r.operationId) {
        return {
          id: r.id,
          type: "operation" as const,
          componentId: r.operationId,
          componentName: r.opName || r.componentName || 'Sconosciuto',
          quantity: parseFloat(r.quantity as any),
          unit: r.unitSnapshot || "ore",
          pricePerUnit: parseFloat((r.opRate ?? r.priceSnapshot ?? "0") as any),
          costType: r.opCostType || undefined,
          sortOrder: r.sortOrder,
        };
      }
      // Tutti gli ID NULL → componente "pending"
      return {
        id: r.id,
        type: "ingredient" as const,
        componentId: "",
        componentName: r.componentName || '(senza nome)',
        quantity: parseFloat(r.quantity as any),
        unit: r.unitSnapshot || "kg",
        pricePerUnit: parseFloat((r.priceSnapshot ?? "0") as any),
        sortOrder: r.sortOrder,
      };
    });

    if (mapped.length === 0) {
      const semi = await getSemiFinishedById(semiFinishedId);
      if (semi?.components) return enrichBlobWithLivePrices(parseJsonBlobComponents(semi.components));
    }

    return mapped;
  } catch {
    // Tabella non esiste o query fallita: fallback al blob JSON
    const semi = await getSemiFinishedById(semiFinishedId);
    if (semi?.components) return enrichBlobWithLivePrices(parseJsonBlobComponents(semi.components));
    return [];
  }
}

/** Sostituisce tutti i componenti di un semilavorato (delete + bulk insert). */
export async function setSemiFinishedComponents(semiFinishedId: string, comps: ComponentInput[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(semiFinishedComponents).where(eq(semiFinishedComponents.semiFinishedRecipeId, semiFinishedId));

  if (comps.length === 0) return;

  const rows: InsertSemiFinishedComponent[] = comps.map((c, i) => {
    // Se componentId è vuoto → componente "pending" (tutti gli ID a NULL, solo componentName)
    const hasId = !!c.componentId;
    return {
      id: crypto.randomUUID(),
      semiFinishedRecipeId: semiFinishedId,
      ingredientId: hasId && c.type === "ingredient" ? c.componentId : null,
      childSemiFinishedId: hasId && c.type === "semi_finished" ? c.componentId : null,
      operationId: hasId && c.type === "operation" ? c.componentId : null,
      componentName: c.componentName || '(senza nome)',
      quantity: String(c.quantity),
      unitSnapshot: c.unit || null,
      priceSnapshot: c.pricePerUnit != null ? String(c.pricePerUnit) : null,
      sortOrder: i,
    };
  });

  await db.insert(semiFinishedComponents).values(rows as any);
}

// ============ IMPORT RICETTE DA TABELLA ============

export type ImportRow = {
  sl_id: string;
  ingrediente_nome: string;
  qty: number;
  um: number;        // 1000 = grammi → converti in kg; 1 = pezzi
  eur_riga: number;
};

export type SlMetadata = {
  name?: string;
  category?: "SPEZIE" | "SALSE" | "VERDURA" | "CARNE" | "ALTRO";
  shelfLifeDays?: number;
  storageMethod?: string;
};

export type ComponentMatchResult = {
  ingrediente_nome: string;
  qty: number;
  um: number;
  matchType: "ingredient_exact" | "ingredient_partial" | "semi_exact" | "semi_partial" | "not_found";
  matchId?: string;
  matchName?: string;
  matchedType?: "ingredient" | "semi_finished";
  // Prezzi live dal DB (se match) — fonte di verità per il costo reale
  livePricePerUnit?: number;    // €/kg o €/unità dal record DB
  liveCost?: number;             // qty_kg × livePricePerUnit (costo ricalcolato dal DB)
  // Dati derivati dal TSV (per confronto)
  tsvEurRiga: number;
  tsvPricePerUnit?: number;      // tsvEurRiga / qty_kg (prezzo implicito dal TSV)
};

export type SlPreviewResult = {
  sl_id: string;
  components: ComponentMatchResult[];
  // Totali basati sul TSV (quello che l'utente ha inserito)
  totalCostTsv: number;
  // Totali ricalcolati usando i prezzi DB dove disponibili, fallback al TSV
  totalCostDb: number;
  totalQtyKg: number;
  estimatedPricePerKgTsv: number;
  estimatedPricePerKgDb: number;
  unmatchedCount: number;
  // Backward-compat (deprecati — mantenuti per non rompere eventuali client vecchi)
  totalCost: number;
  estimatedPricePerKg: number;
};

function fuzzyMatchCandidate(
  search: string,
  candidates: Array<{ id: string; name: string }>
): { id: string; name: string; confidence: "exact" | "partial" } | null {
  const s = search.toLowerCase().trim();
  const exact = candidates.find((c) => c.name.toLowerCase().trim() === s);
  if (exact) return { id: exact.id, name: exact.name, confidence: "exact" };
  const partial = candidates.find(
    (c) => c.name.toLowerCase().includes(s) || s.includes(c.name.toLowerCase())
  );
  if (partial) return { id: partial.id, name: partial.name, confidence: "partial" };
  return null;
}

/**
 * Risolve un componente cercando il match migliore tra ingredienti e semilavorati.
 * Priorità: un match ESATTO (su qualsiasi pool) vince sempre su uno PARZIALE.
 * Questo evita che p.es. "Spezie tenders" venga agganciato per inclusione
 * all'ingrediente "Tenders" quando esiste il semilavorato esatto "Spezie tenders".
 * A parità di confidenza, gli ingredienti hanno la precedenza sui semilavorati.
 */
function matchComponentAcrossPools(
  search: string,
  ingredientsPool: Array<{ id: string; name: string }>,
  semisPool: Array<{ id: string; name: string }>
): { id: string; name: string; confidence: "exact" | "partial"; pool: "ingredient" | "semi_finished" } | null {
  const ing = fuzzyMatchCandidate(search, ingredientsPool);
  if (ing?.confidence === "exact") return { ...ing, pool: "ingredient" };
  const semi = fuzzyMatchCandidate(search, semisPool);
  if (semi?.confidence === "exact") return { ...semi, pool: "semi_finished" };
  // nessun esatto: ripiega sui parziali, ingredienti prima
  if (ing) return { ...ing, pool: "ingredient" };
  if (semi) return { ...semi, pool: "semi_finished" };
  return null;
}

/** Analizza le righe senza toccare il DB — ritorna preview del matching con prezzi live. */
export async function previewSemiFinishedImport(rows: ImportRow[]): Promise<SlPreviewResult[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Scarta righe con nome ingrediente vuoto: non sono recuperabili a valle.
  rows = rows.filter((r) => r.ingrediente_nome && r.ingrediente_nome.trim() !== "");

  const allIngredients = await db
    .select({ id: ingredients.id, name: ingredients.name, price: ingredients.pricePerKgOrUnit })
    .from(ingredients);
  const allSemis = await db
    .select({ id: semiFinishedRecipes.id, name: semiFinishedRecipes.name, price: semiFinishedRecipes.finalPricePerKg })
    .from(semiFinishedRecipes);

  const ingById = new Map<string, { name: string; price: number }>();
  for (const i of allIngredients) ingById.set(i.id, { name: i.name, price: parseFloat(i.price || "0") });
  const semiById = new Map<string, { name: string; price: number }>();
  for (const s of allSemis) semiById.set(s.id, { name: s.name, price: parseFloat(s.price || "0") });

  const grouped = new Map<string, ImportRow[]>();
  for (const row of rows) {
    if (!grouped.has(row.sl_id)) grouped.set(row.sl_id, []);
    grouped.get(row.sl_id)!.push(row);
  }

  const results: SlPreviewResult[] = [];

  for (const [sl_id, slRows] of grouped) {
    const components: ComponentMatchResult[] = [];
    let totalCostTsv = 0;
    let totalCostDb = 0;
    let totalQtyKg = 0;

    for (const row of slRows) {
      totalCostTsv += row.eur_riga;
      const qtyConverted = row.um === 1 ? row.qty : row.qty / 1000;
      if (row.um === 1000) totalQtyKg += qtyConverted;
      const tsvPricePerUnit = qtyConverted > 0 ? row.eur_riga / qtyConverted : undefined;

      const base: ComponentMatchResult = {
        ingrediente_nome: row.ingrediente_nome,
        qty: row.qty,
        um: row.um,
        matchType: "not_found",
        tsvEurRiga: row.eur_riga,
        tsvPricePerUnit,
      };

      const match = matchComponentAcrossPools(row.ingrediente_nome, allIngredients, allSemis);
      if (match?.pool === "ingredient") {
        const livePrice = ingById.get(match.id)?.price ?? 0;
        const liveCost = qtyConverted * livePrice;
        totalCostDb += liveCost;
        components.push({
          ...base,
          matchType: match.confidence === "exact" ? "ingredient_exact" : "ingredient_partial",
          matchId: match.id,
          matchName: match.name,
          matchedType: "ingredient",
          livePricePerUnit: livePrice,
          liveCost,
        });
        continue;
      }

      if (match?.pool === "semi_finished") {
        const livePrice = semiById.get(match.id)?.price ?? 0;
        const liveCost = qtyConverted * livePrice;
        totalCostDb += liveCost;
        components.push({
          ...base,
          matchType: match.confidence === "exact" ? "semi_exact" : "semi_partial",
          matchId: match.id,
          matchName: match.name,
          matchedType: "semi_finished",
          livePricePerUnit: livePrice,
          liveCost,
        });
        continue;
      }

      // Non trovato → usa il costo TSV come fallback per il totale DB
      totalCostDb += row.eur_riga;
      components.push(base);
    }

    const estimatedPricePerKgTsv = totalQtyKg > 0 ? totalCostTsv / totalQtyKg : totalCostTsv;
    const estimatedPricePerKgDb = totalQtyKg > 0 ? totalCostDb / totalQtyKg : totalCostDb;

    results.push({
      sl_id,
      components,
      totalCostTsv,
      totalCostDb,
      totalQtyKg,
      estimatedPricePerKgTsv,
      estimatedPricePerKgDb,
      unmatchedCount: components.filter((c) => c.matchType === "not_found").length,
      // alias backward-compat
      totalCost: totalCostTsv,
      estimatedPricePerKg: estimatedPricePerKgTsv,
    });
  }

  return results;
}

const SL_DEFAULT_NAMES: Record<string, string> = {
  SL_SBACON: "Spezia Bacon",
  SL_SPULLED: "Spezia Pulled Pork",
  SL_SRIBS: "Spezia Ribs",
  SL_STENDERS: "Spezia Tenders",
  SL_KETCHUP: "Ketchup",
  SL_BBQ: "Salsa BBQ",
  SL_BBQRIBS: "Salsa BBQ Ribs",
  SL_MEMPHIS: "Salsa Memphis",
  SL_SENAPE: "Senape",
  SL_SSOVRACOSCE: "Spezia Sovracosce",
};

/** Elimina tutte le ricette finali e i semilavorati (con i loro componenti). */
export async function deleteAllRecipes(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(recipeComponents);
  await db.delete(semiFinishedComponents);
  await db.delete(finalRecipes);
  await db.delete(semiFinishedRecipes);
}

/** Importa semilavorati da tabella TSV in due passate (gestisce cross-riferimenti). */
export async function importSemiFinishedBulk(
  rows: ImportRow[],
  metadata: Record<string, SlMetadata>,
  storeId: string | null
): Promise<{ created: string[]; unmatched: { sl_id: string; ingrediente_nome: string }[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!storeId) throw new Error("Nessun locale selezionato. Imposta il locale preferito nel profilo prima di importare.");

  // Scarta righe con nome ingrediente vuoto: altrimenti finirebbero in DB come
  // "(senza nome)" e non sarebbero più risolvibili dalla pagina debug.
  rows = rows.filter((r) => r.ingrediente_nome && r.ingrediente_nome.trim() !== "");

  const allIngredients = await db
    .select({ id: ingredients.id, name: ingredients.name, price: ingredients.pricePerKgOrUnit })
    .from(ingredients);
  const ingPriceById = new Map<string, number>();
  for (const i of allIngredients) ingPriceById.set(i.id, parseFloat(i.price || "0"));

  const grouped = new Map<string, ImportRow[]>();
  for (const row of rows) {
    if (!grouped.has(row.sl_id)) grouped.set(row.sl_id, []);
    grouped.get(row.sl_id)!.push(row);
  }

  const created: string[] = [];
  const unmatched: { sl_id: string; ingrediente_nome: string }[] = [];

  // Due passate: pass 0 salta SL che hanno riferimenti non ancora risolti
  // pass 1 forza l'inserimento anche con riferimenti mancanti
  for (let pass = 0; pass < 2; pass++) {
    const allSemis = await db
      .select({ id: semiFinishedRecipes.id, name: semiFinishedRecipes.name, price: semiFinishedRecipes.finalPricePerKg })
      .from(semiFinishedRecipes);
    const semiPriceById = new Map<string, number>();
    for (const s of allSemis) semiPriceById.set(s.id, parseFloat(s.price || "0"));

    for (const [sl_id, slRows] of grouped) {
      if (created.includes(sl_id)) continue;

      const meta = metadata[sl_id] || {};
      const displayName = meta.name || SL_DEFAULT_NAMES[sl_id] || sl_id;
      const category = (meta.category || (sl_id.match(/SL_S[A-Z]/) ? "SPEZIE" : "SALSE")) as InsertSemiFinishedRecipe["category"];
      const shelfLifeDays = meta.shelfLifeDays ?? 30;
      const storageMethod = meta.storageMethod ?? "Refrigerato";

      let totalCost = 0;       // costo ricalcolato usando prezzi DB (fonte di verità)
      let totalQtyKg = 0;
      const comps: ComponentInput[] = [];
      let hasUnresolved = false;

      for (const row of slRows) {
        const qtyConverted = row.um === 1 ? row.qty : row.qty / 1000;
        const unit = row.um === 1 ? "unità" : "kg";
        if (row.um === 1000) totalQtyKg += qtyConverted;

        const match = matchComponentAcrossPools(row.ingrediente_nome, allIngredients, allSemis);
        if (match?.pool === "ingredient") {
          // Prezzo DB è la fonte di verità; se a 0 fallback al prezzo implicito TSV
          const livePrice = ingPriceById.get(match.id) ?? 0;
          const tsvPrice = qtyConverted > 0 ? row.eur_riga / qtyConverted : 0;
          const pricePerUnit = livePrice > 0 ? livePrice : tsvPrice;
          totalCost += qtyConverted * pricePerUnit;
          comps.push({ type: "ingredient", componentId: match.id, componentName: match.name, quantity: qtyConverted, unit, pricePerUnit });
          continue;
        }

        if (match?.pool === "semi_finished") {
          const livePrice = semiPriceById.get(match.id) ?? 0;
          const tsvPrice = qtyConverted > 0 ? row.eur_riga / qtyConverted : 0;
          const pricePerUnit = livePrice > 0 ? livePrice : tsvPrice;
          totalCost += qtyConverted * pricePerUnit;
          comps.push({ type: "semi_finished", componentId: match.id, componentName: match.name, quantity: qtyConverted, unit: "kg", pricePerUnit });
          continue;
        }

        if (pass === 0) { hasUnresolved = true; break; }
        unmatched.push({ sl_id, ingrediente_nome: row.ingrediente_nome });
        // Non trovato → fallback al costo TSV per non perdere il valore
        totalCost += row.eur_riga;
        const tsvPrice = qtyConverted > 0 ? row.eur_riga / qtyConverted : 0;
        comps.push({ type: "ingredient", componentId: "", componentName: row.ingrediente_nome, quantity: qtyConverted, unit, pricePerUnit: tsvPrice });
      }

      if (hasUnresolved) continue;

      const finalPricePerKg = totalQtyKg > 0 ? totalCost / totalQtyKg : totalCost;
      const id = crypto.randomUUID();

      await db.insert(semiFinishedRecipes).values({
        id, storeId, code: sl_id, name: displayName, category,
        finalPricePerKg: String(finalPricePerKg.toFixed(2)),
        yieldPercentage: "100",
        shelfLifeDays, storageMethod,
        totalQuantityProduced: String(totalQtyKg.toFixed(3)),
        components: JSON.stringify(comps),
      } as any);

      // Scrivi TUTTI i componenti nella tabella relazionale: quelli matchati
      // con l'ID risolto, quelli unmatched con ID a NULL (solo componentName).
      // Questo li rende visibili alla pagina /recipe-debug per la risoluzione manuale.
      if (comps.length > 0) await setSemiFinishedComponents(id, comps);

      created.push(sl_id);
    }
  }

  return { created, unmatched };
}

// ============ DEBUG RICETTE ============
// Funzioni per la pagina /recipe-debug: mostra e permette di risolvere
// componenti con tutti gli ID a NULL (unmatched), prezzi 0 e riferimenti orfani.

export type UnmatchedComponent = {
  componentRow: "semi_finished_components" | "recipe_components";
  componentId: string;
  parentId: string;
  parentName: string;
  parentCode: string | null;
  parentType: "semi_finished" | "final_recipe";
  componentName: string;
  quantity: string;
  unit: string | null;
  // Suggerimento automatico di match (fuzzy sul componentName)
  suggestion?: {
    type: "ingredient" | "semi_finished";
    id: string;
    name: string;
    price: number;
    confidence: "exact" | "partial";
  };
};

export async function listUnmatchedComponents(): Promise<UnmatchedComponent[]> {
  const db = await getDb();
  if (!db) return [];

  // Carico ingredienti e semi una volta sola per calcolare i suggerimenti
  const allIngs = await db
    .select({ id: ingredients.id, name: ingredients.name, price: ingredients.pricePerKgOrUnit })
    .from(ingredients);
  const allSemis = await db
    .select({ id: semiFinishedRecipes.id, name: semiFinishedRecipes.name, price: semiFinishedRecipes.finalPricePerKg })
    .from(semiFinishedRecipes);

  const suggest = (name: string): UnmatchedComponent["suggestion"] => {
    if (!name || name === '(senza nome)') return undefined;
    const ing = fuzzyMatchCandidate(name, allIngs);
    if (ing) {
      const row = allIngs.find((i) => i.id === ing.id)!;
      return { type: "ingredient", id: ing.id, name: ing.name, price: parseFloat(row.price || "0"), confidence: ing.confidence };
    }
    const semi = fuzzyMatchCandidate(name, allSemis);
    if (semi) {
      const row = allSemis.find((s) => s.id === semi.id)!;
      return { type: "semi_finished", id: semi.id, name: semi.name, price: parseFloat(row.price || "0"), confidence: semi.confidence };
    }
    return undefined;
  };

  const out: UnmatchedComponent[] = [];

  try {
    const sfRows = await db
      .select({
        id: semiFinishedComponents.id,
        parentId: semiFinishedComponents.semiFinishedRecipeId,
        componentName: semiFinishedComponents.componentName,
        quantity: semiFinishedComponents.quantity,
        unit: semiFinishedComponents.unitSnapshot,
        parentName: semiFinishedRecipes.name,
        parentCode: semiFinishedRecipes.code,
      })
      .from(semiFinishedComponents)
      .leftJoin(semiFinishedRecipes, eq(semiFinishedComponents.semiFinishedRecipeId, semiFinishedRecipes.id))
      .where(
        and(
          isNull(semiFinishedComponents.ingredientId),
          isNull(semiFinishedComponents.childSemiFinishedId),
          isNull(semiFinishedComponents.operationId)
        )
      );
    for (const r of sfRows) {
      out.push({
        componentRow: "semi_finished_components",
        componentId: r.id,
        parentId: r.parentId,
        parentName: r.parentName || "(ricetta sconosciuta)",
        parentCode: r.parentCode,
        parentType: "semi_finished",
        componentName: r.componentName,
        quantity: String(r.quantity),
        unit: r.unit,
        suggestion: suggest(r.componentName),
      });
    }
  } catch (e) {
    console.warn("[listUnmatchedComponents] semi_finished_components:", e);
  }

  try {
    const rcRows = await db
      .select({
        id: recipeComponents.id,
        parentId: recipeComponents.recipeId,
        componentName: recipeComponents.componentName,
        quantity: recipeComponents.quantity,
        unit: recipeComponents.unitSnapshot,
        parentName: finalRecipes.name,
        parentCode: finalRecipes.code,
      })
      .from(recipeComponents)
      .leftJoin(finalRecipes, eq(recipeComponents.recipeId, finalRecipes.id))
      .where(
        and(
          isNull(recipeComponents.ingredientId),
          isNull(recipeComponents.semiFinishedId),
          isNull(recipeComponents.operationId)
        )
      );
    for (const r of rcRows) {
      out.push({
        componentRow: "recipe_components",
        componentId: r.id,
        parentId: r.parentId,
        parentName: r.parentName || "(ricetta sconosciuta)",
        parentCode: r.parentCode,
        parentType: "final_recipe",
        componentName: r.componentName,
        quantity: String(r.quantity),
        unit: r.unit,
        suggestion: suggest(r.componentName),
      });
    }
  } catch (e) {
    console.warn("[listUnmatchedComponents] recipe_components:", e);
  }

  return out;
}

export type ZeroPriceItem = {
  type: "ingredient" | "semi_finished";
  id: string;
  name: string;
  code: string | null;
  usedInRecipes: number;
};

export async function listZeroPriceItems(): Promise<ZeroPriceItem[]> {
  const db = await getDb();
  if (!db) return [];

  const out: ZeroPriceItem[] = [];

  try {
    const zeroIngredients = await db
      .select({ id: ingredients.id, name: ingredients.name })
      .from(ingredients)
      .where(eq(ingredients.pricePerKgOrUnit, "0.00"));
    for (const ing of zeroIngredients) {
      let usedCount = 0;
      try {
        const c1 = await db.select({ n: sql<number>`count(*)` }).from(semiFinishedComponents).where(eq(semiFinishedComponents.ingredientId, ing.id));
        const c2 = await db.select({ n: sql<number>`count(*)` }).from(recipeComponents).where(eq(recipeComponents.ingredientId, ing.id));
        usedCount = Number(c1[0]?.n || 0) + Number(c2[0]?.n || 0);
      } catch {}
      out.push({ type: "ingredient", id: ing.id, name: ing.name, code: null, usedInRecipes: usedCount });
    }
  } catch (e) {
    console.warn("[listZeroPriceItems] ingredients:", e);
  }

  try {
    const zeroSemis = await db
      .select({ id: semiFinishedRecipes.id, name: semiFinishedRecipes.name, code: semiFinishedRecipes.code })
      .from(semiFinishedRecipes)
      .where(eq(semiFinishedRecipes.finalPricePerKg, "0.00"));
    for (const s of zeroSemis) {
      let usedCount = 0;
      try {
        const c1 = await db.select({ n: sql<number>`count(*)` }).from(semiFinishedComponents).where(eq(semiFinishedComponents.childSemiFinishedId, s.id));
        const c2 = await db.select({ n: sql<number>`count(*)` }).from(recipeComponents).where(eq(recipeComponents.semiFinishedId, s.id));
        usedCount = Number(c1[0]?.n || 0) + Number(c2[0]?.n || 0);
      } catch {}
      out.push({ type: "semi_finished", id: s.id, name: s.name, code: s.code, usedInRecipes: usedCount });
    }
  } catch (e) {
    console.warn("[listZeroPriceItems] semi_finished:", e);
  }

  return out;
}

export type OrphanedComponent = {
  componentRow: "semi_finished_components" | "recipe_components";
  componentId: string;
  parentId: string;
  parentName: string;
  componentName: string;
  brokenRef: "ingredient" | "semi_finished" | "operation";
  brokenId: string;
};

export async function listOrphanedComponents(): Promise<OrphanedComponent[]> {
  const db = await getDb();
  if (!db) return [];

  const out: OrphanedComponent[] = [];

  // Set di ID validi (fetch una volta solo)
  const validIngIds = new Set<string>();
  const validSemiIds = new Set<string>();
  try {
    const ingAll = await db.select({ id: ingredients.id }).from(ingredients);
    for (const r of ingAll) validIngIds.add(r.id);
  } catch {}
  try {
    const semiAll = await db.select({ id: semiFinishedRecipes.id }).from(semiFinishedRecipes);
    for (const r of semiAll) validSemiIds.add(r.id);
  } catch {}

  // semi_finished_components
  try {
    const sfRows = await db
      .select({
        id: semiFinishedComponents.id,
        parentId: semiFinishedComponents.semiFinishedRecipeId,
        componentName: semiFinishedComponents.componentName,
        ingredientId: semiFinishedComponents.ingredientId,
        childSemiFinishedId: semiFinishedComponents.childSemiFinishedId,
        parentName: semiFinishedRecipes.name,
      })
      .from(semiFinishedComponents)
      .leftJoin(semiFinishedRecipes, eq(semiFinishedComponents.semiFinishedRecipeId, semiFinishedRecipes.id));
    for (const r of sfRows) {
      if (r.ingredientId && !validIngIds.has(r.ingredientId)) {
        out.push({
          componentRow: "semi_finished_components",
          componentId: r.id,
          parentId: r.parentId,
          parentName: r.parentName || "(sconosciuto)",
          componentName: r.componentName,
          brokenRef: "ingredient",
          brokenId: r.ingredientId,
        });
      }
      if (r.childSemiFinishedId && !validSemiIds.has(r.childSemiFinishedId)) {
        out.push({
          componentRow: "semi_finished_components",
          componentId: r.id,
          parentId: r.parentId,
          parentName: r.parentName || "(sconosciuto)",
          componentName: r.componentName,
          brokenRef: "semi_finished",
          brokenId: r.childSemiFinishedId,
        });
      }
    }
  } catch (e) {
    console.warn("[listOrphanedComponents] semi_finished_components:", e);
  }

  // recipe_components
  try {
    const rcRows = await db
      .select({
        id: recipeComponents.id,
        parentId: recipeComponents.recipeId,
        componentName: recipeComponents.componentName,
        ingredientId: recipeComponents.ingredientId,
        semiFinishedId: recipeComponents.semiFinishedId,
        parentName: finalRecipes.name,
      })
      .from(recipeComponents)
      .leftJoin(finalRecipes, eq(recipeComponents.recipeId, finalRecipes.id));
    for (const r of rcRows) {
      if (r.ingredientId && !validIngIds.has(r.ingredientId)) {
        out.push({
          componentRow: "recipe_components",
          componentId: r.id,
          parentId: r.parentId,
          parentName: r.parentName || "(sconosciuto)",
          componentName: r.componentName,
          brokenRef: "ingredient",
          brokenId: r.ingredientId,
        });
      }
      if (r.semiFinishedId && !validSemiIds.has(r.semiFinishedId)) {
        out.push({
          componentRow: "recipe_components",
          componentId: r.id,
          parentId: r.parentId,
          parentName: r.parentName || "(sconosciuto)",
          componentName: r.componentName,
          brokenRef: "semi_finished",
          brokenId: r.semiFinishedId,
        });
      }
    }
  } catch (e) {
    console.warn("[listOrphanedComponents] recipe_components:", e);
  }

  return out;
}

/** Risolve un componente unmatched/orfano associandolo a un ingrediente o semilavorato esistente. */
export async function resolveComponent(args: {
  componentRow: "semi_finished_components" | "recipe_components";
  componentId: string;
  targetType: "ingredient" | "semi_finished";
  targetId: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Carica nome e prezzo del target
  let targetName = "";
  let targetPrice: string | null = null;
  if (args.targetType === "ingredient") {
    const [ing] = await db.select().from(ingredients).where(eq(ingredients.id, args.targetId)).limit(1);
    if (!ing) throw new Error("Ingrediente non trovato");
    targetName = ing.name;
    targetPrice = ing.pricePerKgOrUnit;
  } else {
    const [semi] = await db.select().from(semiFinishedRecipes).where(eq(semiFinishedRecipes.id, args.targetId)).limit(1);
    if (!semi) throw new Error("Semilavorato non trovato");
    targetName = semi.name;
    targetPrice = semi.finalPricePerKg;
  }

  if (args.componentRow === "semi_finished_components") {
    await db
      .update(semiFinishedComponents)
      .set({
        ingredientId: args.targetType === "ingredient" ? args.targetId : null,
        childSemiFinishedId: args.targetType === "semi_finished" ? args.targetId : null,
        operationId: null,
        componentName: targetName,
        priceSnapshot: targetPrice,
      })
      .where(eq(semiFinishedComponents.id, args.componentId));
  } else {
    await db
      .update(recipeComponents)
      .set({
        ingredientId: args.targetType === "ingredient" ? args.targetId : null,
        semiFinishedId: args.targetType === "semi_finished" ? args.targetId : null,
        operationId: null,
        componentName: targetName,
        priceSnapshot: targetPrice,
      })
      .where(eq(recipeComponents.id, args.componentId));
  }
}

/** Elimina una singola riga componente dalla tabella relazionale. */
export async function deleteComponentRow(args: {
  componentRow: "semi_finished_components" | "recipe_components";
  componentId: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (args.componentRow === "semi_finished_components") {
    await db.delete(semiFinishedComponents).where(eq(semiFinishedComponents.id, args.componentId));
  } else {
    await db.delete(recipeComponents).where(eq(recipeComponents.id, args.componentId));
  }
}

/**
 * Elimina in massa tutte le righe componente "senza nome" o non collegate:
 * righe con tutti gli ID NULL E componentName vuoto/placeholder. Utile per
 * ripulire residui di import mal formati.
 */
export async function deleteUnnamedComponents(): Promise<{ deletedSemi: number; deletedFinal: number }> {
  const db = await getDb();
  if (!db) return { deletedSemi: 0, deletedFinal: 0 };

  const isPlaceholder = (n: string | null | undefined) =>
    !n || n.trim() === "" || n === "(senza nome)" || n === "Sconosciuto";

  let deletedSemi = 0;
  let deletedFinal = 0;

  try {
    const sfRows = await db
      .select({ id: semiFinishedComponents.id, componentName: semiFinishedComponents.componentName })
      .from(semiFinishedComponents)
      .where(
        and(
          isNull(semiFinishedComponents.ingredientId),
          isNull(semiFinishedComponents.childSemiFinishedId),
          isNull(semiFinishedComponents.operationId)
        )
      );
    for (const r of sfRows) {
      if (isPlaceholder(r.componentName)) {
        await db.delete(semiFinishedComponents).where(eq(semiFinishedComponents.id, r.id));
        deletedSemi++;
      }
    }
  } catch (e) {
    console.warn("[deleteUnnamedComponents] semi_finished_components:", e);
  }

  try {
    const rcRows = await db
      .select({ id: recipeComponents.id, componentName: recipeComponents.componentName })
      .from(recipeComponents)
      .where(
        and(
          isNull(recipeComponents.ingredientId),
          isNull(recipeComponents.semiFinishedId),
          isNull(recipeComponents.operationId)
        )
      );
    for (const r of rcRows) {
      if (isPlaceholder(r.componentName)) {
        await db.delete(recipeComponents).where(eq(recipeComponents.id, r.id));
        deletedFinal++;
      }
    }
  } catch (e) {
    console.warn("[deleteUnnamedComponents] recipe_components:", e);
  }

  return { deletedSemi, deletedFinal };
}

/**
 * Recupera i nomi originali dal blob JSON per le righe "(senza nome)" nella
 * tabella relazionale. Il blob `semi_finished_recipes.components` contiene i
 * ComponentInput originali (incluso il nome TSV) anche quando non fu scritto
 * in tabella relazionale; usiamo sortOrder come chiave di allineamento.
 */
export async function recoverComponentNames(): Promise<{ recovered: number }> {
  const db = await getDb();
  if (!db) return { recovered: 0 };

  const isPlaceholder = (n: string | null | undefined) =>
    !n || n.trim() === "" || n === "(senza nome)" || n === "Sconosciuto";

  let recovered = 0;

  // ── Semi-finished ──────────────────────────────────────────────────────────
  try {
    const sfRecipes = await db
      .select({ id: semiFinishedRecipes.id, components: semiFinishedRecipes.components })
      .from(semiFinishedRecipes);

    for (const recipe of sfRecipes) {
      if (!recipe.components) continue;
      const raw = recipe.components;
      const blob: Array<{ componentId?: string; componentName?: string }> =
        Array.isArray(raw) ? raw : (() => { try { return JSON.parse(raw as string); } catch { return []; } })();
      if (!Array.isArray(blob) || blob.length === 0) continue;

      const relRows = await db
        .select({
          id: semiFinishedComponents.id,
          sortOrder: semiFinishedComponents.sortOrder,
          componentName: semiFinishedComponents.componentName,
        })
        .from(semiFinishedComponents)
        .where(
          and(
            eq(semiFinishedComponents.semiFinishedRecipeId, recipe.id),
            isNull(semiFinishedComponents.ingredientId),
            isNull(semiFinishedComponents.childSemiFinishedId),
            isNull(semiFinishedComponents.operationId)
          )
        );

      for (const row of relRows) {
        if (!isPlaceholder(row.componentName)) continue;
        const blobEntry = blob[row.sortOrder ?? 0];
        if (!blobEntry) continue;
        const blobName = blobEntry.componentName;
        if (!isPlaceholder(blobName) && blobName) {
          await db
            .update(semiFinishedComponents)
            .set({ componentName: blobName })
            .where(eq(semiFinishedComponents.id, row.id));
          recovered++;
        }
      }
    }
  } catch (e) {
    console.warn("[recoverComponentNames] semi_finished_components:", e);
  }

  // ── Final recipes ──────────────────────────────────────────────────────────
  try {
    const frRecipes = await db
      .select({ id: finalRecipes.id, components: finalRecipes.components })
      .from(finalRecipes);

    for (const recipe of frRecipes) {
      if (!recipe.components) continue;
      const raw = recipe.components;
      const blob: Array<{ componentId?: string; componentName?: string }> =
        Array.isArray(raw) ? raw : (() => { try { return JSON.parse(raw as string); } catch { return []; } })();
      if (!Array.isArray(blob) || blob.length === 0) continue;

      const relRows = await db
        .select({
          id: recipeComponents.id,
          sortOrder: recipeComponents.sortOrder,
          componentName: recipeComponents.componentName,
        })
        .from(recipeComponents)
        .where(
          and(
            eq(recipeComponents.recipeId, recipe.id),
            isNull(recipeComponents.ingredientId),
            isNull(recipeComponents.semiFinishedId),
            isNull(recipeComponents.operationId)
          )
        );

      for (const row of relRows) {
        if (!isPlaceholder(row.componentName)) continue;
        const blobEntry = blob[row.sortOrder ?? 0];
        if (!blobEntry) continue;
        const blobName = blobEntry.componentName;
        if (!isPlaceholder(blobName) && blobName) {
          await db
            .update(recipeComponents)
            .set({ componentName: blobName })
            .where(eq(recipeComponents.id, row.id));
          recovered++;
        }
      }
    }
  } catch (e) {
    console.warn("[recoverComponentNames] recipe_components:", e);
  }

  return { recovered };
}
