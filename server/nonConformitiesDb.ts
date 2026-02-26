import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

let _pool: mysql.Pool | null = null;
function getPool(): mysql.Pool {
  if (!_pool) {
    _pool = mysql.createPool(process.env.DATABASE_URL!);
  }
  return _pool;
}

export interface NonConformity {
  id: string;
  ncCode: string;
  date: Date;
  detectedByUserId: number;
  detectedByUserName: string;
  productionCheckId?: string;
  recipeName?: string;
  weekStartDate?: Date;
  description: string;
  immediateAction?: string;
  productTreatment?: string;
  rootCauseAnalysis?: string;
  rootCauseCategory?: string;
  correctiveActionPlan?: string;
  correctiveActionDeadline?: Date;
  correctiveActionResponsible?: string;
  effectivenessVerification?: string;
  verificationDate?: Date;
  verificationEvidence?: string;
  status: string;
  qualityManagerSignature?: string;
  qualityManagerSignatureDate?: Date;
  directorSignature?: string;
  directorSignatureDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function createNonConformity(data: {
  detectedByUserId: number;
  detectedByUserName: string;
  productionCheckId?: string;
  recipeName?: string;
  weekStartDate?: Date;
  description: string;
  immediateAction?: string;
  productTreatment?: string;
}): Promise<NonConformity> {
  const conn = await getPool().getConnection();
  try {
    const id = uuidv4();
    
    // Genera codice NC automatico: NC-YYYY-XXX
    const year = new Date().getFullYear();
    const [rows] = await conn.query<any[]>(
      "SELECT COUNT(*) as count FROM non_conformities WHERE nc_code LIKE ?",
      [`NC-${year}-%`]
    );
    const count = rows[0].count + 1;
    const ncCode = `NC-${year}-${String(count).padStart(3, "0")}`;
    
    await conn.query(
      `INSERT INTO non_conformities (
        id, nc_code, date, detected_by_user_id, detected_by_user_name,
        production_check_id, recipe_name, week_start_date,
        description, immediate_action, product_treatment, status
      ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        id,
        ncCode,
        data.detectedByUserId,
        data.detectedByUserName,
        data.productionCheckId || null,
        data.recipeName || null,
        data.weekStartDate || null,
        data.description,
        data.immediateAction || null,
        data.productTreatment || null,
      ]
    );
    
    const [created] = await conn.query<any[]>(
      "SELECT * FROM non_conformities WHERE id = ?",
      [id]
    );
    return mapNonConformity(created[0]);
  } finally {
    conn.release();
  }
}

export async function updateNonConformity(
  id: string,
  data: Partial<Omit<NonConformity, "id" | "ncCode" | "createdAt" | "updatedAt">>
): Promise<void> {
  const conn = await getPool().getConnection();
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.immediateAction !== undefined) {
      updates.push("immediate_action = ?");
      values.push(data.immediateAction);
    }
    if (data.productTreatment !== undefined) {
      updates.push("product_treatment = ?");
      values.push(data.productTreatment);
    }
    if (data.rootCauseAnalysis !== undefined) {
      updates.push("root_cause_analysis = ?");
      values.push(data.rootCauseAnalysis);
    }
    if (data.rootCauseCategory !== undefined) {
      updates.push("root_cause_category = ?");
      values.push(data.rootCauseCategory);
    }
    if (data.correctiveActionPlan !== undefined) {
      updates.push("corrective_action_plan = ?");
      values.push(data.correctiveActionPlan);
    }
    if (data.correctiveActionDeadline !== undefined) {
      updates.push("corrective_action_deadline = ?");
      values.push(data.correctiveActionDeadline);
    }
    if (data.correctiveActionResponsible !== undefined) {
      updates.push("corrective_action_responsible = ?");
      values.push(data.correctiveActionResponsible);
    }
    if (data.effectivenessVerification !== undefined) {
      updates.push("effectiveness_verification = ?");
      values.push(data.effectivenessVerification);
    }
    if (data.verificationDate !== undefined) {
      updates.push("verification_date = ?");
      values.push(data.verificationDate);
    }
    if (data.verificationEvidence !== undefined) {
      updates.push("verification_evidence = ?");
      values.push(data.verificationEvidence);
    }
    if (data.status !== undefined) {
      updates.push("status = ?");
      values.push(data.status);
    }
    if (data.qualityManagerSignature !== undefined) {
      updates.push("quality_manager_signature = ?, quality_manager_signature_date = NOW()");
      values.push(data.qualityManagerSignature);
    }
    if (data.directorSignature !== undefined) {
      updates.push("director_signature = ?, director_signature_date = NOW()");
      values.push(data.directorSignature);
    }
    
    if (updates.length === 0) return;
    
    values.push(id);
    await conn.query(
      `UPDATE non_conformities SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
      values
    );
  } finally {
    conn.release();
  }
}

export async function getNonConformityById(id: string): Promise<NonConformity | null> {
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.query<any[]>(
      "SELECT * FROM non_conformities WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? mapNonConformity(rows[0]) : null;
  } finally {
    conn.release();
  }
}

export async function getAllNonConformities(filters?: {
  status?: string;
  year?: number;
}): Promise<NonConformity[]> {
  const conn = await getPool().getConnection();
  try {
    let query = "SELECT * FROM non_conformities WHERE 1=1";
    const params: any[] = [];
    
    if (filters?.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }
    if (filters?.year) {
      query += " AND YEAR(date) = ?";
      params.push(filters.year);
    }
    
    query += " ORDER BY date DESC";
    
    const [rows] = await conn.query<any[]>(query, params);
    return rows.map(mapNonConformity);
  } finally {
    conn.release();
  }
}

export async function getNonConformitiesByProductionCheck(
  productionCheckId: string
): Promise<NonConformity[]> {
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.query<any[]>(
      "SELECT * FROM non_conformities WHERE production_check_id = ? ORDER BY date DESC",
      [productionCheckId]
    );
    return rows.map(mapNonConformity);
  } finally {
    conn.release();
  }
}

export async function deleteNonConformity(id: string): Promise<void> {
  const conn = await getPool().getConnection();
  try {
    await conn.query("DELETE FROM non_conformities WHERE id = ?", [id]);
  } finally {
    conn.release();
  }
}

function mapNonConformity(row: any): NonConformity {
  return {
    id: row.id,
    ncCode: row.nc_code,
    date: new Date(row.date),
    detectedByUserId: row.detected_by_user_id,
    detectedByUserName: row.detected_by_user_name,
    productionCheckId: row.production_check_id,
    recipeName: row.recipe_name,
    weekStartDate: row.week_start_date ? new Date(row.week_start_date) : undefined,
    description: row.description,
    immediateAction: row.immediate_action,
    productTreatment: row.product_treatment,
    rootCauseAnalysis: row.root_cause_analysis,
    rootCauseCategory: row.root_cause_category,
    correctiveActionPlan: row.corrective_action_plan,
    correctiveActionDeadline: row.corrective_action_deadline
      ? new Date(row.corrective_action_deadline)
      : undefined,
    correctiveActionResponsible: row.corrective_action_responsible,
    effectivenessVerification: row.effectiveness_verification,
    verificationDate: row.verification_date ? new Date(row.verification_date) : undefined,
    verificationEvidence: row.verification_evidence,
    status: row.status,
    qualityManagerSignature: row.quality_manager_signature,
    qualityManagerSignatureDate: row.quality_manager_signature_date
      ? new Date(row.quality_manager_signature_date)
      : undefined,
    directorSignature: row.director_signature,
    directorSignatureDate: row.director_signature_date
      ? new Date(row.director_signature_date)
      : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
