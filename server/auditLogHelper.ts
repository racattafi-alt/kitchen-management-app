import { createAuditLog } from "./auditLogDb";
import { v4 as uuidv4 } from "uuid";

/**
 * Helper per creare log audit in modo semplice
 */
export async function logAction(params: {
  storeId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
}) {
  try {
    await createAuditLog({
      id: uuidv4(),
      ...params,
    });
  } catch (error) {
    // Log error ma non bloccare l'operazione principale
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Azioni comuni per audit log
 */
export const AuditActions = {
  // Ordini
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_DELETED: "order.deleted",
  ORDER_SUBMITTED: "order.submitted",
  
  // Ricette
  RECIPE_CREATED: "recipe.created",
  RECIPE_UPDATED: "recipe.updated",
  RECIPE_DELETED: "recipe.deleted",
  
  // Produzioni
  PRODUCTION_CREATED: "production.created",
  PRODUCTION_UPDATED: "production.updated",
  PRODUCTION_DELETED: "production.deleted",
  
  // Ingredienti
  INGREDIENT_CREATED: "ingredient.created",
  INGREDIENT_UPDATED: "ingredient.updated",
  INGREDIENT_DELETED: "ingredient.deleted",
  
  // HACCP
  HACCP_BATCH_CREATED: "haccp.batch_created",
  HACCP_RECORD_CREATED: "haccp.record_created",
  
  // Waste
  WASTE_RECORDED: "waste.recorded",
  
  // Store
  STORE_CREATED: "store.created",
  STORE_UPDATED: "store.updated",
  STORE_USER_ADDED: "store.user_added",
  STORE_USER_REMOVED: "store.user_removed",
} as const;

/**
 * Tipi di entità per audit log
 */
export const EntityTypes = {
  ORDER: "order",
  RECIPE: "recipe",
  PRODUCTION: "production",
  INGREDIENT: "ingredient",
  HACCP_BATCH: "haccp_batch",
  HACCP_RECORD: "haccp_record",
  WASTE: "waste",
  STORE: "store",
  USER: "user",
} as const;
