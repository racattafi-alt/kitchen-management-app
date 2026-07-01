import { getDb } from "./db";
import { stores, storeUsers, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Recuperare tutti gli store attivi
 */
export async function getAllStores() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(stores).where(eq(stores.isActive, true));
}

/**
 * Recuperare uno store per ID
 */
export async function getStoreById(storeId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  return result[0] || null;
}

/**
 * Recuperare gli store accessibili da un utente
 */
export async function getUserStores(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      storeId: storeUsers.storeId,
      role: storeUsers.role,
      storeName: stores.name,
      storeAddress: stores.address,
      storePhone: stores.phone,
      storeEmail: stores.email,
      storeIsActive: stores.isActive,
      storeIsGlobal: stores.isGlobal,
      storeCreatedAt: stores.createdAt,
    })
    .from(storeUsers)
    .innerJoin(stores, eq(storeUsers.storeId, stores.id))
    .where(and(eq(storeUsers.userId, userId), eq(stores.isActive, true)));

  return result;
}

/**
 * Verificare se un utente ha accesso a uno store
 */
export async function userHasAccessToStore(userId: number, storeId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db
    .select()
    .from(storeUsers)
    .where(and(eq(storeUsers.userId, userId), eq(storeUsers.storeId, storeId)))
    .limit(1);

  return result.length > 0;
}

/**
 * Recuperare il ruolo di un utente in uno store
 */
export async function getUserStoreRole(userId: number, storeId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select({ role: storeUsers.role })
    .from(storeUsers)
    .where(and(eq(storeUsers.userId, userId), eq(storeUsers.storeId, storeId)))
    .limit(1);

  return result[0]?.role || null;
}

/**
 * Creare un nuovo store
 */
export async function createStore(data: {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  settings?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(stores).values(data);
  return data;
}

/**
 * Aggiornare uno store
 */
/**
 * Verificare se uno store è globale
 */
export async function isStoreGlobal(storeId: string | null): Promise<boolean> {
  if (!storeId) return false;
  const store = await getStoreById(storeId);
  return store?.isGlobal === true;
}

export async function updateStore(
  storeId: string,
  data: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    settings?: any;
    isActive?: boolean;
    isGlobal?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(stores).set(data).where(eq(stores.id, storeId));
}

/**
 * Associare un utente a uno store
 */
export async function addUserToStore(userId: number, storeId: string, role: "admin" | "manager" | "user") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(storeUsers).values({ userId, storeId, role });
}

/**
 * Rimuovere un utente da uno store
 */
export async function removeUserFromStore(userId: number, storeId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(storeUsers).where(and(eq(storeUsers.userId, userId), eq(storeUsers.storeId, storeId)));
}

/**
 * Aggiornare il ruolo di un utente in uno store
 */
export async function updateUserStoreRole(userId: number, storeId: string, role: "admin" | "manager" | "user") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(storeUsers).set({ role }).where(and(eq(storeUsers.userId, userId), eq(storeUsers.storeId, storeId)));
}

/**
 * Impostare lo store preferito di un utente
 */
export async function setUserPreferredStore(userId: number, storeId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ preferredStoreId: storeId }).where(eq(users.id, userId));
}

/**
 * Recuperare lo store preferito di un utente
 */
export async function getUserPreferredStore(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({ preferredStoreId: users.preferredStoreId }).from(users).where(eq(users.id, userId)).limit(1);
  return result[0]?.preferredStoreId || null;
}

/**
 * Recuperare tutti gli utenti di uno store
 */
export async function getStoreUsers(storeId: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      userId: storeUsers.userId,
      role: storeUsers.role,
      userName: users.name,
      userEmail: users.email,
      userCreatedAt: storeUsers.createdAt,
    })
    .from(storeUsers)
    .innerJoin(users, eq(storeUsers.userId, users.id))
    .where(eq(storeUsers.storeId, storeId));

  return result;
}
