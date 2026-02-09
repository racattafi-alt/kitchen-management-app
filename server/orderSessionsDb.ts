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

// Helper per eseguire query
async function executeQuery(query: string, params: any[] = []) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    await connection.end();
  }
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
  notes: string | null
) {
  const id = nanoid();
  const totalItems = orderData.items?.length || 0;

  await executeQuery(
    `INSERT INTO order_history (id, userId, userName, orderData, pdfUrl, totalItems, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [id, userId, userName, JSON.stringify(orderData), pdfUrl, totalItems, notes]
  );

  return id;
}

// Ottiene storico ordini dell'utente
export async function getUserOrderHistory(userId: number): Promise<OrderHistoryItem[]> {
  const rows = await executeQuery(
    `SELECT * FROM order_history WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`,
    [userId]
  );
  return (rows as any[]).map((row) => ({
    ...row,
    orderData: typeof row.orderData === 'string' ? JSON.parse(row.orderData) : row.orderData,
  }));
}

// Ottiene tutti gli ordini (solo admin)
export async function getAllOrderHistory(): Promise<OrderHistoryItem[]> {
  const rows = await executeQuery(
    `SELECT * FROM order_history ORDER BY createdAt DESC LIMIT 100`
  );
  return (rows as any[]).map((row) => ({
    ...row,
    orderData: typeof row.orderData === 'string' ? JSON.parse(row.orderData) : row.orderData,
  }));
}
