import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

const pool = mysql.createPool(process.env.DATABASE_URL!);

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  categoryId: string;
  categoryName?: string;
  title: string;
  description?: string;
  fileType: string;
  fileUrl: string;
  fileKey: string;
  fileSizeKb?: number;
  uploadedByUserId: number;
  uploadedByUserName: string;
  uploadDate: Date;
  documentDate?: Date;
  expiryDate?: Date;
  referenceNumber?: string;
  tags?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAllCategories(): Promise<DocumentCategory[]> {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<any[]>(
      "SELECT * FROM document_categories ORDER BY name"
    );
    return rows.map(mapCategory);
  } finally {
    conn.release();
  }
}

export async function createDocument(data: {
  categoryId: string;
  title: string;
  description?: string;
  fileType: string;
  fileUrl: string;
  fileKey: string;
  fileSizeKb?: number;
  uploadedByUserId: number;
  uploadedByUserName: string;
  documentDate?: Date;
  expiryDate?: Date;
  referenceNumber?: string;
  tags?: string;
  notes?: string;
}): Promise<Document> {
  const conn = await pool.getConnection();
  try {
    const id = uuidv4();
    
    await conn.query(
      `INSERT INTO documents (
        id, category_id, title, description, file_type, file_url, file_key,
        file_size_kb, uploaded_by_user_id, uploaded_by_user_name,
        document_date, expiry_date, reference_number, tags, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.categoryId,
        data.title,
        data.description || null,
        data.fileType,
        data.fileUrl,
        data.fileKey,
        data.fileSizeKb || null,
        data.uploadedByUserId,
        data.uploadedByUserName,
        data.documentDate || null,
        data.expiryDate || null,
        data.referenceNumber || null,
        data.tags || null,
        data.notes || null,
      ]
    );
    
    const [created] = await conn.query<any[]>(
      `SELECT d.*, dc.name as category_name
       FROM documents d
       LEFT JOIN document_categories dc ON d.category_id = dc.id
       WHERE d.id = ?`,
      [id]
    );
    return mapDocument(created[0]);
  } finally {
    conn.release();
  }
}

export async function getDocumentsByCategory(categoryId: string): Promise<Document[]> {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<any[]>(
      `SELECT d.*, dc.name as category_name
       FROM documents d
       LEFT JOIN document_categories dc ON d.category_id = dc.id
       WHERE d.category_id = ?
       ORDER BY d.upload_date DESC`,
      [categoryId]
    );
    return rows.map(mapDocument);
  } finally {
    conn.release();
  }
}

export async function getAllDocuments(): Promise<Document[]> {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<any[]>(
      `SELECT d.*, dc.name as category_name
       FROM documents d
       LEFT JOIN document_categories dc ON d.category_id = dc.id
       ORDER BY d.upload_date DESC`
    );
    return rows.map(mapDocument);
  } finally {
    conn.release();
  }
}

export async function getExpiringDocuments(daysAhead: number = 30): Promise<Document[]> {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<any[]>(
      `SELECT d.*, dc.name as category_name
       FROM documents d
       LEFT JOIN document_categories dc ON d.category_id = dc.id
       WHERE d.expiry_date IS NOT NULL
         AND d.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
         AND d.expiry_date >= CURDATE()
       ORDER BY d.expiry_date ASC`,
      [daysAhead]
    );
    return rows.map(mapDocument);
  } finally {
    conn.release();
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.query("DELETE FROM documents WHERE id = ?", [id]);
  } finally {
    conn.release();
  }
}

function mapCategory(row: any): DocumentCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: new Date(row.created_at),
  };
}

function mapDocument(row: any): Document {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    title: row.title,
    description: row.description,
    fileType: row.file_type,
    fileUrl: row.file_url,
    fileKey: row.file_key,
    fileSizeKb: row.file_size_kb,
    uploadedByUserId: row.uploaded_by_user_id,
    uploadedByUserName: row.uploaded_by_user_name,
    uploadDate: new Date(row.upload_date),
    documentDate: row.document_date ? new Date(row.document_date) : undefined,
    expiryDate: row.expiry_date ? new Date(row.expiry_date) : undefined,
    referenceNumber: row.reference_number,
    tags: row.tags,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
