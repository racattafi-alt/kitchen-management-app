import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  datetime,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow with role-based access control.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "manager", "cook"]).default("user").notNull(),
  preferredStoreId: varchar("preferredStoreId", { length: 36 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabella stores (punti vendita)
 */
export const stores = mysqlTable("stores", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  settings: json("settings"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

/**
 * Tabella storeUsers (associazione utenti-store con ruoli)
 */
export const storeUsers = mysqlTable("storeUsers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  storeId: varchar("storeId", { length: 36 }).notNull(),
  role: mysqlEnum("role", ["admin", "manager", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StoreUser = typeof storeUsers.$inferSelect;
export type InsertStoreUser = typeof storeUsers.$inferInsert;

/**
 * Tabella fornitori
 */
export const suppliers = mysqlTable("suppliers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("storeId", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  contact: varchar("contact", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Livello 0: Ingredienti base
 */
export const ingredients = mysqlTable("ingredients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("storeId", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  supplierId: varchar("supplierId", { length: 36 }),
  supplier: varchar("supplier", { length: 255 }),
  category: mysqlEnum("category", [
    "Additivi",
    "Alcolici",
    "Bevande",
    "Birra",
    "Carni",
    "Farine",
    "Latticini",
    "Non Food",
    "Packaging",
    "Spezie",
    "Verdura",
    "Altro",
  ]).notNull(),
  unitType: mysqlEnum("unitType", ["u", "k"]).notNull(),
  packageType: mysqlEnum("packageType", ["Sacco", "Busta", "Brick", "Cartone", "Scatola", "Bottiglia", "Barattolo", "Lattina", "Sfuso"]),
  department: mysqlEnum("department", ["Cucina", "Sala"]).default("Cucina").notNull(),
  packageQuantity: decimal("packageQuantity", { precision: 10, scale: 3 }).notNull(),
  packagePrice: decimal("packagePrice", { precision: 10, scale: 2 }).notNull(),
  pricePerKgOrUnit: decimal("pricePerKgOrUnit", { precision: 10, scale: 2 }).notNull(),
  minOrderQuantity: decimal("minOrderQuantity", { precision: 10, scale: 3 }),
  packageSize: decimal("packageSize", { precision: 10, scale: 3 }),
  brand: varchar("brand", { length: 255 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  isFood: boolean("is_food").default(true).notNull(),
  isOrderable: boolean("isOrderable").default(true).notNull(),
  isSellable: boolean("isSellable").default(true).notNull(),
  isSalaItem: boolean("isSalaItem").default(false).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  allergens: json("allergens").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = typeof ingredients.$inferInsert;

/**
 * Livello 1-N: Semilavorati (ricorsivi)
 */
export const semiFinishedRecipes = mysqlTable("semi_finished_recipes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["SPEZIE", "SALSE", "VERDURA", "CARNE", "ALTRO"]).notNull(),
  finalPricePerKg: decimal("finalPricePerKg", { precision: 10, scale: 2 }).notNull(),
  yieldPercentage: decimal("yieldPercentage", { precision: 6, scale: 3 }).notNull(),
  shelfLifeDays: int("shelfLifeDays").notNull(),
  storageMethod: text("storageMethod").notNull(),
  totalQuantityProduced: decimal("totalQuantityProduced", { precision: 10, scale: 3 }),
  components: json("components"),
  productionSteps: json("productionSteps"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SemiFinishedRecipe = typeof semiFinishedRecipes.$inferSelect;
export type InsertSemiFinishedRecipe = typeof semiFinishedRecipes.$inferInsert;

/**
 * Livello 2: Ricette Finali
 */
export const finalRecipes = mysqlTable("final_recipes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("storeId", { length: 36 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["Pane", "Carne", "Salse", "Verdure", "Formaggi", "Altro"]).notNull(),
  components: json("components"),
  yieldPercentage: decimal("yieldPercentage", { precision: 6, scale: 3 }).notNull(),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
  productionOperations: json("productionOperations"),
  conservationMethod: text("conservationMethod").notNull(),
  maxConservationTime: varchar("maxConservationTime", { length: 50 }).notNull(),
  serviceWastePercentage: decimal("serviceWastePercentage", { precision: 6, scale: 3 }).default("0"),
  serviceWastePerIngredient: json("serviceWastePerIngredient"),
  unitType: mysqlEnum("unitType", ["u", "k"]).default("k").notNull(),
  unitWeight: decimal("unitWeight", { precision: 10, scale: 3 }),
  producedQuantity: decimal("producedQuantity", { precision: 10, scale: 3 }),
  measurementType: mysqlEnum("measurementType", ["weight_only", "unit_only", "both"]).default("weight_only").notNull(),
  pieceWeight: decimal("pieceWeight", { precision: 10, scale: 3 }),
  isSemiFinished: boolean("isSemiFinished").default(false).notNull(),
  isSellable: boolean("isSellable").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sellingPrice: decimal("sellingPrice", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinalRecipe = typeof finalRecipes.$inferSelect;
export type InsertFinalRecipe = typeof finalRecipes.$inferInsert;

/**
 * Food Matrix: Vista consolidata di tutti gli item
 */
export const foodMatrix = mysqlTable("food_matrix", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sourceType: mysqlEnum("sourceType", ["INGREDIENT", "SEMI_FINISHED", "FINAL_RECIPE"]).notNull(),
  sourceId: varchar("sourceId", { length: 36 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  tag: mysqlEnum("tag", ["FIC", "AQ"]).notNull(),
  unitType: mysqlEnum("unitType", ["u", "k"]).notNull(),
  pricePerKgOrUnit: decimal("pricePerKgOrUnit", { precision: 10, scale: 2 }).notNull(),
  suggestedPortion: decimal("suggestedPortion", { precision: 10, scale: 3 }),
  weightPerUnit: decimal("weightPerUnit", { precision: 10, scale: 3 }),
  categoryForMenu: mysqlEnum("categoryForMenu", [
    "Pane",
    "Salse",
    "Carne",
    "Verdure",
    "Formaggi",
    "Altro",
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FoodMatrixItem = typeof foodMatrix.$inferSelect;
export type InsertFoodMatrixItem = typeof foodMatrix.$inferInsert;

/**
 * Operazioni: Costi di lavoro e energia
 */
export const operations = mysqlTable("operations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  costType: mysqlEnum("costType", ["ENERGIA", "LAVORO"]).notNull(),
  maxKw: decimal("maxKw", { precision: 10, scale: 3 }),
  efficiencyMultiplier: decimal("efficiencyMultiplier", { precision: 5, scale: 3 }),
  avgConsumptionKw: decimal("avgConsumptionKw", { precision: 10, scale: 3 }),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Operation = typeof operations.$inferSelect;
export type InsertOperation = typeof operations.$inferInsert;

/**
 * Produzioni Settimanali
 */
export const weeklyProductions = mysqlTable("weekly_productions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("storeId", { length: 36 }).notNull(),
  weekStartDate: datetime("weekStartDate").notNull(),
  productionType: mysqlEnum("productionType", ["final", "semifinished"]).default("final").notNull(),
  recipeFinalId: varchar("recipeFinalId", { length: 36 }),
  semiFinishedId: varchar("semiFinishedId", { length: 36 }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyProduction = typeof weeklyProductions.$inferSelect;
export type InsertWeeklyProduction = typeof weeklyProductions.$inferInsert;

/**
 * Menu: Tipi di menu e piatti
 */
export const menuTypes = mysqlTable("menu_types", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  serviceType: mysqlEnum("serviceType", ["DINE_IN", "DELIVERY", "TAKEAWAY", "EVENT"]).notNull(),
  fixedCosts: json("fixedCosts") as unknown as any,
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuType = typeof menuTypes.$inferSelect;
export type InsertMenuType = typeof menuTypes.$inferInsert;

/**
 * Menu Items: Piatti nel menu
 */
export const menuItems = mysqlTable("menu_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  menuTypeId: varchar("menuTypeId", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "PANINI",
    "CARNE_AL_PIATTO",
    "INSALATE",
    "BEVANDE",
    "PROMOZIONI",
  ]).notNull(),
  components: json("components"),
  suggestedSalePrice: decimal("suggestedSalePrice", { precision: 10, scale: 2 }).notNull(),
  actualSalePrice: decimal("actualSalePrice", { precision: 10, scale: 2 }).notNull(),
  isPromotion: boolean("isPromotion").default(false),
  promotionComponents: json("promotionComponents"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

/**
 * Waste Management: Tracciamento scarti
 */
export const wasteRecords = mysqlTable("waste_records", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productionBatchId: varchar("productionBatchId", { length: 36 }),
  componentId: varchar("componentId", { length: 36 }).notNull(),
  wasteType: mysqlEnum("wasteType", ["PRODUCTION", "SERVICE"]).notNull(),
  wastePercentage: decimal("wastePercentage", { precision: 5, scale: 3 }).notNull(),
  notes: text("notes"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WasteRecord = typeof wasteRecords.$inferSelect;
export type InsertWasteRecord = typeof wasteRecords.$inferInsert;

/**
 * HACCP: Lotti di produzione e schede HACCP
 */
export const productionBatches = mysqlTable("production_batches", {
  id: varchar("id", { length: 36 }).primaryKey(),
  batchCode: varchar("batchCode", { length: 50 }).notNull().unique(),
  recipeFinalId: varchar("recipeFinalId", { length: 36 }).notNull(),
  plannedDate: datetime("plannedDate").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitType: mysqlEnum("unitType", ["u", "k"]).notNull(),
  status: mysqlEnum("status", ["PLANNED", "IN_PROGRESS", "COMPLETED", "FAILED"]).default("PLANNED"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductionBatch = typeof productionBatches.$inferSelect;
export type InsertProductionBatch = typeof productionBatches.$inferInsert;

/**
 * HACCP Sheet: Schede di conformità
 */
export const haccp = mysqlTable("haccp", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productionBatchId: varchar("productionBatchId", { length: 36 }).notNull(),
  recipeName: varchar("recipeName", { length: 255 }).notNull(),
  batchId: varchar("batchId", { length: 50 }).notNull(),
  plannedDate: datetime("plannedDate").notNull(),
  ingredients: json("ingredients"),
  checkpoints: json("checkpoints"),
  operatorSignature: varchar("operatorSignature", { length: 255 }),
  managerVerification: varchar("managerVerification", { length: 255 }),
  storageUrl: varchar("storageUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HACCPRecord = typeof haccp.$inferSelect;
export type InsertHACCPRecord = typeof haccp.$inferInsert;

/**
 * Cloud Storage: Archiviazione documenti
 */
export const cloudStorage = mysqlTable("cloud_storage", {
  id: varchar("id", { length: 36 }).primaryKey(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  documentType: mysqlEnum("documentType", [
    "HACCP",
    "SUPPLIER_CERT",
    "BATCH_PHOTO",
    "COMPLIANCE",
  ]).notNull(),
  relatedEntityId: varchar("relatedEntityId", { length: 36 }),
  relatedEntityType: mysqlEnum("relatedEntityType", [
    "PRODUCTION_BATCH",
    "INGREDIENT",
    "RECIPE",
  ]),
  uploadedBy: varchar("uploadedBy", { length: 36 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CloudStorageFile = typeof cloudStorage.$inferSelect;
export type InsertCloudStorageFile = typeof cloudStorage.$inferInsert;

/**
 * Orders: Storico ordini fornitori
 */
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("storeId", { length: 36 }).notNull(),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  weekId: varchar("weekId", { length: 50 }),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  whatsappSent: boolean("whatsappSent").default(false).notNull(),
  notes: text("notes"),
  createdBy: varchar("createdBy", { length: 36 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * OrderItems: Dettaglio articoli per ordine
 */
export const orderItems = mysqlTable("order_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("orderId", { length: 36 }).notNull(),
  itemType: mysqlEnum("itemType", ["INGREDIENT", "SEMI_FINISHED"]).notNull(),
  itemId: varchar("itemId", { length: 36 }).notNull(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  supplier: varchar("supplier", { length: 255 }).notNull(),
  quantityOrdered: decimal("quantityOrdered", { precision: 10, scale: 3 }).notNull(),
  unitType: mysqlEnum("unitType", ["u", "k"]).notNull(),
  pricePerUnit: decimal("pricePerUnit", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * RecipeVersions: Storico modifiche ricette
 */
export const recipeVersions = mysqlTable("recipe_versions", {
  id: int("id").autoincrement().primaryKey(),
  recipeId: varchar("recipe_id", { length: 36 }).notNull(),
  recipeType: mysqlEnum("recipe_type", ["final", "semifinished"]).notNull(),
  versionNumber: int("version_number").notNull(),
  snapshot: json("snapshot").notNull(),
  changedBy: varchar("changed_by", { length: 64 }).notNull(),
  changeDescription: text("change_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RecipeVersion = typeof recipeVersions.$inferSelect;
export type InsertRecipeVersion = typeof recipeVersions.$inferInsert;


// =============================================================================
// TABELLE ORDINI MULTI-UTENTE
// =============================================================================

/**
 * UserOrderSessions: Carrello persistente per ogni utente
 */
export const userOrderSessions = mysqlTable("user_order_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  ingredientId: varchar("ingredientId", { length: 36 }).notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull().default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * OrderHistory: Storico ordini inviati
 */
export const orderHistory = mysqlTable("order_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  userName: varchar("userName", { length: 255 }).notNull(),
  orderData: json("orderData").$type<Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: string;
    unit: string;
  }>>().notNull(),
  pdfUrl: text("pdfUrl"),
  totalItems: int("totalItems").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Relazioni
export const userOrderSessionsRelations = relations(userOrderSessions, ({ one }) => ({
  user: one(users, {
    fields: [userOrderSessions.userId],
    references: [users.id],
  }),
  ingredient: one(ingredients, {
    fields: [userOrderSessions.ingredientId],
    references: [ingredients.id],
  }),
}));

export const orderHistoryRelations = relations(orderHistory, ({ one }) => ({
  user: one(users, {
    fields: [orderHistory.userId],
    references: [users.id],
  }),
}));

// Tipi TypeScript
export type UserOrderSession = typeof userOrderSessions.$inferSelect;
export type NewUserOrderSession = typeof userOrderSessions.$inferInsert;
export type OrderHistory = typeof orderHistory.$inferSelect;
export type NewOrderHistory = typeof orderHistory.$inferInsert;

/**
 * Fridges: Anagrafica frighi e freezer
 */
export const fridges = mysqlTable("fridges", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["fridge", "freezer"]).notNull(),
  location: mysqlEnum("location", ["kitchen", "sala"]).notNull(),
  category: varchar("category", { length: 100 }),
  minTemp: decimal("minTemp", { precision: 4, scale: 1 }).notNull(),
  maxTemp: decimal("maxTemp", { precision: 4, scale: 1 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * FridgeTemperatureLogs: Storico temperature frighi
 */
export const fridgeTemperatureLogs = mysqlTable("fridge_temperature_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  fridgeId: varchar("fridgeId", { length: 36 }).notNull().references(() => fridges.id, { onDelete: "cascade" }),
  date: datetime("date").notNull(),
  temperature: decimal("temperature", { precision: 4, scale: 1 }).notNull(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  isOutOfRange: boolean("isOutOfRange").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * HaccpWeeklySheets: Schede HACCP settimanali
 */
export const haccpWeeklySheets = mysqlTable("haccp_weekly_sheets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  weekStartDate: datetime("weekStartDate").notNull(),
  weekEndDate: datetime("weekEndDate").notNull(),
  status: mysqlEnum("status", ["draft", "completed", "approved"]).default("draft").notNull(),
  completedBy: int("completedBy").references(() => users.id),
  completedAt: timestamp("completedAt"),
  approvedBy: int("approvedBy").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * HaccpProductionChecks: Controlli HACCP per ogni produzione
 */
export const haccpProductionChecks = mysqlTable("haccp_production_checks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  haccpSheetId: varchar("haccpSheetId", { length: 36 }).notNull().references(() => haccpWeeklySheets.id, { onDelete: "cascade" }),
  productionId: varchar("productionId", { length: 36 }).notNull().references(() => weeklyProductions.id, { onDelete: "cascade" }),
  recipeName: varchar("recipeName", { length: 255 }).notNull(),
  quantityProduced: decimal("quantityProduced", { precision: 10, scale: 3 }).notNull(),
  chillTemp4C: boolean("chillTemp4C").default(false),
  chillTempMinus20C: boolean("chillTempMinus20C").default(false),
  cookingTempOk: boolean("cookingTempOk").default(false),
  isCompliant: boolean("isCompliant").default(true).notNull(),
  nonComplianceReason: text("nonComplianceReason"),
  correctiveAction: text("correctiveAction"),
  checkedBy: int("checkedBy").references(() => users.id),
  checkedAt: timestamp("checkedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Relazioni HACCP e Frighi
export const fridgesRelations = relations(fridges, ({ many }) => ({
  temperatureLogs: many(fridgeTemperatureLogs),
}));

export const fridgeTemperatureLogsRelations = relations(fridgeTemperatureLogs, ({ one }) => ({
  fridge: one(fridges, {
    fields: [fridgeTemperatureLogs.fridgeId],
    references: [fridges.id],
  }),
  user: one(users, {
    fields: [fridgeTemperatureLogs.userId],
    references: [users.id],
  }),
}));

export const haccpWeeklySheetsRelations = relations(haccpWeeklySheets, ({ many, one }) => ({
  productionChecks: many(haccpProductionChecks),
  completedByUser: one(users, {
    fields: [haccpWeeklySheets.completedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [haccpWeeklySheets.approvedBy],
    references: [users.id],
  }),
}));

export const haccpProductionChecksRelations = relations(haccpProductionChecks, ({ one }) => ({
  haccpSheet: one(haccpWeeklySheets, {
    fields: [haccpProductionChecks.haccpSheetId],
    references: [haccpWeeklySheets.id],
  }),
  production: one(weeklyProductions, {
    fields: [haccpProductionChecks.productionId],
    references: [weeklyProductions.id],
  }),
  checkedByUser: one(users, {
    fields: [haccpProductionChecks.checkedBy],
    references: [users.id],
  }),
}));

// Tipi TypeScript HACCP e Frighi
export type Fridge = typeof fridges.$inferSelect;
export type NewFridge = typeof fridges.$inferInsert;
export type FridgeTemperatureLog = typeof fridgeTemperatureLogs.$inferSelect;
export type NewFridgeTemperatureLog = typeof fridgeTemperatureLogs.$inferInsert;
export type HaccpWeeklySheet = typeof haccpWeeklySheets.$inferSelect;
export type NewHaccpWeeklySheet = typeof haccpWeeklySheets.$inferInsert;
export type HaccpProductionCheck = typeof haccpProductionChecks.$inferSelect;
export type NewHaccpProductionCheck = typeof haccpProductionChecks.$inferInsert;
