import { getDb } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { auditLogs } from "../drizzle/schema";

export interface AuditLogEntry {
  id: string;
  storeId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

/**
 * Crea un nuovo log di audit
 */
export async function createAuditLog(data: Omit<AuditLogEntry, "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(auditLogs).values({
    ...data,
    details: data.details ? JSON.stringify(data.details) : null,
  } as any);
  
  return data;
}

/**
 * Recupera log di audit per uno store specifico
 */
export async function getAuditLogsByStore(storeId: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.storeId, storeId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

/**
 * Recupera log di audit per un utente specifico
 */
export async function getAuditLogsByUser(userId: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

/**
 * Recupera log di audit per un'entità specifica
 */
export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityType, entityType),
        eq(auditLogs.entityId, entityId)
      )
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

/**
 * Recupera tutti i log di audit con filtri opzionali
 */
export async function getAllAuditLogs(filters?: {
  storeId?: string;
  userId?: string;
  entityType?: string;
  action?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query: any = db.select().from(auditLogs);
  
  const conditions: any[] = [];
  
  if (filters?.storeId) {
    conditions.push(eq(auditLogs.storeId, filters.storeId));
  }
  if (filters?.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  if (filters?.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }
  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  return query
    .orderBy(desc(auditLogs.createdAt))
    .limit(filters?.limit || 100);
}
