import { getDb } from "./db";
import { 
  fridges, 
  fridgeTemperatureLogs, 
  haccpWeeklySheets, 
  haccpProductionChecks,
  type Fridge,
  type NewFridge,
  type FridgeTemperatureLog,
  type NewFridgeTemperatureLog,
  type HaccpWeeklySheet,
  type NewHaccpWeeklySheet,
  type HaccpProductionCheck,
  type NewHaccpProductionCheck,
} from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// ==================== FRIGHI ====================

/**
 * Ottiene tutti i frighi attivi
 */
export async function getAllFridges(): Promise<Fridge[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fridges).where(eq(fridges.isActive, true));
}

/**
 * Ottiene un frigo per ID
 */
export async function getFridgeById(id: string): Promise<Fridge | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(fridges).where(eq(fridges.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Crea un nuovo frigo
 */
export async function createFridge(data: Omit<NewFridge, "id">): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = uuidv4();
  await db.insert(fridges).values({ ...data, id });
  return id;
}

/**
 * Aggiorna un frigo
 */
export async function updateFridge(id: string, data: Partial<NewFridge>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(fridges).set(data).where(eq(fridges.id, id));
}

/**
 * Elimina un frigo (soft delete)
 */
export async function deleteFridge(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(fridges).set({ isActive: false }).where(eq(fridges.id, id));
}

// ==================== TEMPERATURE LOGS ====================

/**
 * Aggiunge una rilevazione temperatura
 */
export async function addTemperatureLog(data: Omit<NewFridgeTemperatureLog, "id">): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verifica se temperatura è fuori range
  const fridge = await getFridgeById(data.fridgeId);
  if (!fridge) throw new Error("Frigo non trovato");
  
  const temp = parseFloat(data.temperature as any);
  const isOutOfRange = temp < parseFloat(fridge.minTemp as any) || temp > parseFloat(fridge.maxTemp as any);
  
  const id = uuidv4();
  await db.insert(fridgeTemperatureLogs).values({ 
    ...data, 
    id, 
    isOutOfRange 
  });
  
  return id;
}

/**
 * Ottiene storico temperature per un frigo
 */
export async function getTemperatureLogsByFridge(
  fridgeId: string, 
  startDate?: Date, 
  endDate?: Date
): Promise<FridgeTemperatureLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (startDate && endDate) {
    return db
      .select()
      .from(fridgeTemperatureLogs)
      .where(
        and(
          eq(fridgeTemperatureLogs.fridgeId, fridgeId),
          gte(fridgeTemperatureLogs.date, startDate),
          lte(fridgeTemperatureLogs.date, endDate)
        )
      )
      .orderBy(desc(fridgeTemperatureLogs.date));
  }
  
  return db
    .select()
    .from(fridgeTemperatureLogs)
    .where(eq(fridgeTemperatureLogs.fridgeId, fridgeId))
    .orderBy(desc(fridgeTemperatureLogs.date));
}

/**
 * Ottiene temperature fuori range ultime 24h
 */
export async function getOutOfRangeTemperatures(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return db
    .select({
      id: fridgeTemperatureLogs.id,
      fridgeName: fridges.name,
      temperature: fridgeTemperatureLogs.temperature,
      date: fridgeTemperatureLogs.date,
      minTemp: fridges.minTemp,
      maxTemp: fridges.maxTemp,
      notes: fridgeTemperatureLogs.notes,
    })
    .from(fridgeTemperatureLogs)
    .innerJoin(fridges, eq(fridgeTemperatureLogs.fridgeId, fridges.id))
    .where(
      and(
        eq(fridgeTemperatureLogs.isOutOfRange, true),
        gte(fridgeTemperatureLogs.date, yesterday)
      )
    )
    .orderBy(desc(fridgeTemperatureLogs.date));
}

// ==================== HACCP WEEKLY SHEETS ====================

/**
 * Ottiene scheda HACCP per settimana corrente
 */
export async function getCurrentWeekHaccpSheet(): Promise<HaccpWeeklySheet | null> {
  const db = await getDb();
  if (!db) return null;
  
  const now = new Date();
  const result = await db
    .select()
    .from(haccpWeeklySheets)
    .where(
      and(
        lte(haccpWeeklySheets.weekStartDate, now),
        gte(haccpWeeklySheets.weekEndDate, now)
      )
    )
    .limit(1);
  
  return result[0] || null;
}

/**
 * Crea una nuova scheda HACCP settimanale
 */
export async function createHaccpWeeklySheet(data: Omit<NewHaccpWeeklySheet, "id">): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = uuidv4();
  await db.insert(haccpWeeklySheets).values({ ...data, id });
  return id;
}

/**
 * Aggiorna scheda HACCP
 */
export async function updateHaccpWeeklySheet(id: string, data: Partial<NewHaccpWeeklySheet>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(haccpWeeklySheets).set(data).where(eq(haccpWeeklySheets.id, id));
}

/**
 * Ottiene tutte le schede HACCP (ultime 10)
 */
export async function getAllHaccpSheets(): Promise<HaccpWeeklySheet[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(haccpWeeklySheets).orderBy(desc(haccpWeeklySheets.weekStartDate)).limit(10);
}

// ==================== HACCP PRODUCTION CHECKS ====================

/**
 * Crea controllo HACCP per una produzione
 */
export async function createProductionCheck(data: Omit<NewHaccpProductionCheck, "id">): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = uuidv4();
  await db.insert(haccpProductionChecks).values({ ...data, id });
  return id;
}

/**
 * Aggiorna controllo HACCP
 */
export async function updateProductionCheck(id: string, data: Partial<NewHaccpProductionCheck>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(haccpProductionChecks).set(data).where(eq(haccpProductionChecks.id, id));
}

/**
 * Ottiene controlli HACCP per una scheda settimanale
 */
export async function getProductionChecksBySheet(sheetId: string): Promise<HaccpProductionCheck[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(haccpProductionChecks).where(eq(haccpProductionChecks.haccpSheetId, sheetId));
}

/**
 * Elimina controllo HACCP
 */
export async function deleteProductionCheck(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(haccpProductionChecks).where(eq(haccpProductionChecks.id, id));
}
