import { randomUUID } from "crypto";
import mysql from "mysql2/promise";

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

// ============ INVOICES ============

export async function createInvoice(data: {
  fileUrl: string;
  uploadedBy: number;
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
}) {
  const id = randomUUID();
  await executeQuery(
    `INSERT INTO invoices (id, fileUrl, uploadedBy, supplierName, invoiceNumber, invoiceDate, status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [id, data.fileUrl, data.uploadedBy, data.supplierName || null, data.invoiceNumber || null, data.invoiceDate || null]
  );
  return id;
}

export async function updateInvoiceExtraction(invoiceId: string, data: {
  extractedText: string;
  extractedData: any;
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  totalAmount?: number;
}) {
  await executeQuery(
    `UPDATE invoices 
     SET extractedText = ?, extractedData = ?, supplierName = COALESCE(?, supplierName),
         invoiceNumber = COALESCE(?, invoiceNumber), invoiceDate = COALESCE(?, invoiceDate),
         totalAmount = ?, status = 'matched', processedAt = NOW()
     WHERE id = ?`,
    [
      data.extractedText,
      JSON.stringify(data.extractedData),
      data.supplierName || null,
      data.invoiceNumber || null,
      data.invoiceDate || null,
      data.totalAmount || null,
      invoiceId
    ]
  );
}

export async function getInvoiceById(id: string) {
  const rows: any = await executeQuery(
    `SELECT * FROM invoices WHERE id = ?`,
    [id]
  );
  
  if (rows.length === 0) return null;
  
  const invoice = rows[0];
  if (invoice.extractedData && typeof invoice.extractedData === 'string') {
    invoice.extractedData = JSON.parse(invoice.extractedData);
  }
  return invoice;
}

export async function getAllInvoices(limit = 50) {
  const rows: any = await executeQuery(
    `SELECT id, supplierName, invoiceNumber, invoiceDate, totalAmount, status, uploadedAt, confirmedAt
     FROM invoices
     ORDER BY uploadedAt DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const confirmedAt = status === 'confirmed' ? new Date() : null;
  await executeQuery(
    `UPDATE invoices SET status = ?, confirmedAt = ? WHERE id = ?`,
    [status, confirmedAt, invoiceId]
  );
}

// ============ INVOICE ITEMS ============

export async function createInvoiceItem(data: {
  invoiceId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice: number;
  ingredientId?: string;
  matchConfidence?: number;
  matchMethod?: string;
  oldPrice?: number;
  newPrice?: number;
  priceChange?: number;
  isAnomalous?: boolean;
}) {
  const id = randomUUID();
  await executeQuery(
    `INSERT INTO invoice_items (
      id, invoiceId, productName, quantity, unit, unitPrice, totalPrice,
      ingredientId, matchConfidence, matchMethod, oldPrice, newPrice, priceChange, isAnomalous
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.invoiceId,
      data.productName,
      data.quantity,
      data.unit,
      data.unitPrice || null,
      data.totalPrice,
      data.ingredientId || null,
      data.matchConfidence || null,
      data.matchMethod || null,
      data.oldPrice || null,
      data.newPrice || null,
      data.priceChange || null,
      data.isAnomalous || false
    ]
  );
  return id;
}

export async function getInvoiceItems(invoiceId: string) {
  const rows: any = await executeQuery(
    `SELECT ii.*, i.name as ingredientName
     FROM invoice_items ii
     LEFT JOIN ingredients i ON ii.ingredientId = i.id
     WHERE ii.invoiceId = ?
     ORDER BY ii.createdAt`,
    [invoiceId]
  );
  return rows;
}

export async function updateInvoiceItem(itemId: string, data: {
  ingredientId?: string;
  matchMethod?: string;
  isConfirmed?: boolean;
  confirmedBy?: number;
  oldPrice?: number;
  newPrice?: number;
  priceChange?: number;
  isAnomalous?: boolean;
}) {
  const confirmedAt = data.isConfirmed ? new Date() : null;
  
  await executeQuery(
    `UPDATE invoice_items
     SET ingredientId = COALESCE(?, ingredientId),
         matchMethod = COALESCE(?, matchMethod),
         isConfirmed = COALESCE(?, isConfirmed),
         confirmedAt = ?,
         confirmedBy = COALESCE(?, confirmedBy),
         oldPrice = COALESCE(?, oldPrice),
         newPrice = COALESCE(?, newPrice),
         priceChange = COALESCE(?, priceChange),
         isAnomalous = COALESCE(?, isAnomalous)
     WHERE id = ?`,
    [
      data.ingredientId || null,
      data.matchMethod || null,
      data.isConfirmed !== undefined ? data.isConfirmed : null,
      confirmedAt,
      data.confirmedBy || null,
      data.oldPrice !== undefined ? data.oldPrice : null,
      data.newPrice !== undefined ? data.newPrice : null,
      data.priceChange !== undefined ? data.priceChange : null,
      data.isAnomalous !== undefined ? data.isAnomalous : null,
      itemId
    ]
  );
}

// ============ PRODUCT MAPPINGS (Memoria Abbinamenti) ============

export async function findProductMapping(productName: string, supplierId?: string) {
  const normalized = productName.toLowerCase().trim();
  
  const query = supplierId
    ? `SELECT * FROM product_mappings 
       WHERE productNameNormalized = ? AND (supplierId = ? OR supplierId IS NULL)
       ORDER BY timesUsed DESC, lastUsedAt DESC LIMIT 1`
    : `SELECT * FROM product_mappings 
       WHERE productNameNormalized = ?
       ORDER BY timesUsed DESC, lastUsedAt DESC LIMIT 1`;
  
  const params = supplierId ? [normalized, supplierId] : [normalized];
  const rows: any = await executeQuery(query, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function createOrUpdateProductMapping(data: {
  supplierId?: string;
  supplierName: string;
  productNameInInvoice: string;
  brandInInvoice?: string;
  ingredientId: string;
  ingredientName: string;
  createdBy: number;
}) {
  const normalized = data.productNameInInvoice.toLowerCase().trim();
  
  // Try to update existing mapping
  const updateResult: any = await executeQuery(
    `UPDATE product_mappings
     SET timesUsed = timesUsed + 1, lastUsedAt = NOW()
     WHERE productNameNormalized = ? AND ingredientId = ? AND (supplierId = ? OR supplierId IS NULL)`,
    [normalized, data.ingredientId, data.supplierId || null]
  );
  
  if (updateResult.affectedRows > 0) {
    return; // Updated existing
  }
  
  // Create new mapping
  const id = randomUUID();
  await executeQuery(
    `INSERT INTO product_mappings (
      id, supplierId, supplierName, productNameInInvoice, productNameNormalized,
      brandInInvoice, ingredientId, ingredientName, createdBy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.supplierId || null,
      data.supplierName,
      data.productNameInInvoice,
      normalized,
      data.brandInInvoice || null,
      data.ingredientId,
      data.ingredientName,
      data.createdBy
    ]
  );
}

// ============ PRICE HISTORY ============

export async function createPriceHistory(data: {
  ingredientId: string;
  ingredientName: string;
  oldPackagePrice: number;
  newPackagePrice: number;
  oldPricePerUnit: number;
  newPricePerUnit: number;
  priceChange: number;
  invoiceId?: string;
  invoiceItemId?: string;
  supplierId?: string;
  changeReason?: string;
  isAnomalous?: boolean;
  changedBy: number;
  notes?: string;
}) {
  const id = randomUUID();
  await executeQuery(
    `INSERT INTO price_history (
      id, ingredientId, ingredientName, oldPackagePrice, newPackagePrice,
      oldPricePerUnit, newPricePerUnit, priceChange, invoiceId, invoiceItemId,
      supplierId, changeReason, isAnomalous, changedBy, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.ingredientId,
      data.ingredientName,
      data.oldPackagePrice,
      data.newPackagePrice,
      data.oldPricePerUnit,
      data.newPricePerUnit,
      data.priceChange,
      data.invoiceId || null,
      data.invoiceItemId || null,
      data.supplierId || null,
      data.changeReason || 'invoice',
      data.isAnomalous || false,
      data.changedBy,
      data.notes || null
    ]
  );
  return id;
}

export async function getPriceHistory(ingredientId?: string, limit = 100) {
  const query = ingredientId
    ? `SELECT * FROM price_history WHERE ingredientId = ? ORDER BY changedAt DESC LIMIT ?`
    : `SELECT * FROM price_history ORDER BY changedAt DESC LIMIT ?`;
  
  const params = ingredientId ? [ingredientId, limit] : [limit];
  const rows: any = await executeQuery(query, params);
  return rows;
}

export async function getAnomalousPriceChanges(days = 30) {
  const rows: any = await executeQuery(
    `SELECT ph.*, i.invoiceNumber, i.invoiceDate
     FROM price_history ph
     LEFT JOIN invoices i ON ph.invoiceId = i.id
     WHERE ph.isAnomalous = TRUE
       AND ph.changedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
     ORDER BY ABS(ph.priceChange) DESC`,
    [days]
  );
  return rows;
}

// ============ REPORTING ============

export async function getImpactOnFinalRecipes(invoiceId: string) {
  // Get affected ingredients from this invoice
  const affectedIngredients: any = await executeQuery(
    `SELECT DISTINCT ingredientId FROM invoice_items
     WHERE invoiceId = ? AND isConfirmed = TRUE AND ingredientId IS NOT NULL`,
    [invoiceId]
  );
  
  if (affectedIngredients.length === 0) return [];
  
  const ingredientIds = affectedIngredients.map((r: any) => r.ingredientId);
  const placeholders = ingredientIds.map(() => '?').join(',');
  
  // Calculate impact on final recipes
  const rows: any = await executeQuery(
    `SELECT 
      fr.id,
      fr.name as recipeName,
      fr.totalCost as oldCost,
      SUM((fri.quantity / 1000) * ing.pricePerKgOrUnit) as newCost,
      ((SUM((fri.quantity / 1000) * ing.pricePerKgOrUnit) - fr.totalCost) / fr.totalCost * 100) as costIncrease
     FROM final_recipes fr
     JOIN final_recipe_ingredients fri ON fr.id = fri.recipeFinalId
     JOIN ingredients ing ON fri.ingredientId = ing.id
     WHERE fri.ingredientId IN (${placeholders})
     GROUP BY fr.id
     HAVING costIncrease > 0.5
     ORDER BY costIncrease DESC`,
    ingredientIds
  );
  
  return rows;
}

// ============ FUZZY MATCHING ============

export async function fuzzyMatchIngredients(productName: string, limit = 5) {
  const searchTerm = `%${productName.toLowerCase()}%`;
  
  const rows: any = await executeQuery(
    `SELECT id, name, supplier, category, pricePerKgOrUnit
     FROM ingredients
     WHERE LOWER(name) LIKE ? OR LOWER(brand) LIKE ?
     ORDER BY 
       CASE 
         WHEN LOWER(name) = LOWER(?) THEN 1
         WHEN LOWER(name) LIKE ? THEN 2
         ELSE 3
       END,
       name
     LIMIT ?`,
    [searchTerm, searchTerm, productName, `${productName.toLowerCase()}%`, limit]
  );
  
  return rows;
}
