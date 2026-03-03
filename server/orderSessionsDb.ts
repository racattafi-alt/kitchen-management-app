import { getDb } from "./db";
import { nanoid } from "nanoid";
import mysql from "mysql2/promise";

// Tipi per le sessioni ordini
export interface OrderSessionItem {
  id: string;
  userId: number;
  ingredientId: string;
  quantity: number;
  ingredientName: string;
  unitType: string;
  pricePerKgOrUnit: number;
  category: string;
  supplier: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderHistoryItem {
  id: string;
  userId: number;
  userName: string;
  orderData: any;
  pdfUrl: string | null;
  totalItems: number;
  notes: string | null;
  createdAt: Date;
}

// Shared pool — avoids opening a new TCP connection on every query
let _pool: mysql.Pool | null = null;
function getPool(): mysql.Pool {
  if (!_pool) {
    _pool = mysql.createPool({
      uri: process.env.DATABASE_URL!,
      connectionLimit: 5,
      waitForConnections: true,
    });
  }
  return _pool;
}

// Helper per eseguire query
async function executeQuery(query: string, params: any[] = []) {
  const [rows] = await getPool().execute(query, params);
  return rows;
}

// Ottiene la sessione ordine corrente dell'utente
export async function getUserOrderSession(userId: number): Promise<OrderSessionItem[]> {
  const rows = await executeQuery(
    `SELECT s.*, i.name as ingredientName, i.unitType, i.pricePerKgOrUnit, i.category, i.supplier
     FROM user_order_sessions s
     JOIN ingredients i ON s.ingredientId = i.id
     WHERE s.userId = ?
     ORDER BY i.name ASC`,
    [userId]
  );
  return rows as OrderSessionItem[];
}

// Aggiorna o crea item nella sessione
export async function upsertOrderSessionItem(
  userId: number,
  ingredientId: string,
  quantity: number
) {
  if (quantity <= 0) {
    // Rimuovi se quantità è 0
    await executeQuery(
      `DELETE FROM user_order_sessions WHERE userId = ? AND ingredientId = ?`,
      [userId, ingredientId]
    );
    return null;
  }

  // Verifica se esiste
  const existing = await executeQuery(
    `SELECT id FROM user_order_sessions WHERE userId = ? AND ingredientId = ?`,
    [userId, ingredientId]
  );

  if ((existing as any[]).length > 0) {
    // Update
    await executeQuery(
      `UPDATE user_order_sessions SET quantity = ?, updatedAt = NOW() WHERE userId = ? AND ingredientId = ?`,
      [quantity, userId, ingredientId]
    );
  } else {
    // Insert
    const id = nanoid();
    await executeQuery(
      `INSERT INTO user_order_sessions (id, userId, ingredientId, quantity, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [id, userId, ingredientId, quantity]
    );
  }

  return { userId, ingredientId, quantity };
}

// Svuota la sessione ordine dell'utente
export async function clearUserOrderSession(userId: number) {
  await executeQuery(`DELETE FROM user_order_sessions WHERE userId = ?`, [userId]);
}

// Salva ordine nello storico
export async function saveOrderToHistory(
  userId: number,
  userName: string,
  orderData: any,
  pdfUrl: string | null,
  notes: string | null,
  storeId: string
) {
  const id = nanoid();
  const totalItems = orderData.items?.length || 0;

  await executeQuery(
    `INSERT INTO order_history (id, userId, userName, orderData, pdfUrl, totalItems, notes, storeId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [id, userId, userName, JSON.stringify(orderData), pdfUrl, totalItems, notes, storeId]
  );

  return id;
}

// Ottiene storico ordini dell'utente
export async function getUserOrderHistory(userId: number, storeId: string): Promise<OrderHistoryItem[]> {
  const rows = await executeQuery(
    `SELECT * FROM order_history WHERE userId = ? AND storeId = ? ORDER BY createdAt DESC LIMIT 50`,
    [userId, storeId]
  );
  return (rows as any[]).map((row) => ({
    ...row,
    orderData: typeof row.orderData === 'string' ? JSON.parse(row.orderData) : row.orderData,
  }));
}

// Ottiene tutti gli ordini (solo admin)
export async function getAllOrderHistory(storeId: string): Promise<OrderHistoryItem[]> {
  const rows = await executeQuery(
    `SELECT * FROM order_history WHERE (storeId = ? OR storeId = 'default-store-001') ORDER BY createdAt DESC LIMIT 500`,
    [storeId]
  );
  return (rows as any[]).map((row) => ({
    ...row,
    orderData: typeof row.orderData === 'string' ? JSON.parse(row.orderData) : row.orderData,
  }));
}

// ============ SHOPPING LIST SESSION ============

export interface ShoppingListSession {
  userId: number;
  orderQuantities: Record<string, number>;
  orderPackages: Record<string, number>;
  updatedAt: Date;
}

// Ottiene la sessione shopping list dell'utente
export async function getShoppingListSession(userId: number): Promise<ShoppingListSession | null> {
  const rows = await executeQuery(
    `SELECT * FROM shopping_list_sessions WHERE userId = ? LIMIT 1`,
    [userId]
  );
  
  if ((rows as any[]).length === 0) {
    return null;
  }
  
  const row = (rows as any[])[0];
  return {
    userId: row.userId,
    orderQuantities: typeof row.orderQuantities === 'string' ? JSON.parse(row.orderQuantities) : row.orderQuantities,
    orderPackages: typeof row.orderPackages === 'string' ? JSON.parse(row.orderPackages) : row.orderPackages,
    updatedAt: row.updatedAt,
  };
}

// Salva la sessione shopping list
export async function saveShoppingListSession(
  userId: number,
  orderQuantities: Record<string, number>,
  orderPackages: Record<string, number>
) {
  // Verifica se esiste
  const existing = await executeQuery(
    `SELECT userId FROM shopping_list_sessions WHERE userId = ?`,
    [userId]
  );

  if ((existing as any[]).length > 0) {
    // Update
    await executeQuery(
      `UPDATE shopping_list_sessions 
       SET orderQuantities = ?, orderPackages = ?, updatedAt = NOW() 
       WHERE userId = ?`,
      [JSON.stringify(orderQuantities), JSON.stringify(orderPackages), userId]
    );
  } else {
    // Insert
    await executeQuery(
      `INSERT INTO shopping_list_sessions (userId, orderQuantities, orderPackages, createdAt, updatedAt)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [userId, JSON.stringify(orderQuantities), JSON.stringify(orderPackages)]
    );
  }

  return { userId, orderQuantities, orderPackages };
}

// Cancella la sessione shopping list
export async function clearShoppingListSession(userId: number) {
  await executeQuery(`DELETE FROM shopping_list_sessions WHERE userId = ?`, [userId]);
}
