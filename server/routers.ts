import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { orderSessionsRouter } from "./orderSessionsRouter";
import { haccpRouter as haccpSheetRouter } from "./haccpRouter";
import { fridgesRouter } from "./fridgesRouter";
import { invoicesRouter } from "./invoicesRouter";
import { nonConformitiesRouter } from "./nonConformitiesRouter";
import { documentsRouter } from "./documentsRouter";
import { storesRouter } from "./storesRouter";
import crypto from "crypto";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { validateRecipe } from "../shared/recipeValidation";
import {
  updateIngredientAcrossStores,
  updateSupplierAcrossStores,
  updateRecipeAcrossStores,
} from "./multiStoreEditorDb.js";
import { getAllStores, isStoreGlobal } from "./storesDb.js";

async function getAllActiveStoreIds(): Promise<string[]> {
  const stores = await getAllStores();
  return stores.map(s => s.id);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============ PROCEDURE AUTENTICAZIONE ============
const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),
  logout: protectedProcedure.mutation(({ ctx }) => {
    ctx.logout();
    return { success: true };
  }),
});

// ============ PROCEDURE INGREDIENTI ============
const ingredientsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getIngredients(ctx.currentStoreId);
  }),
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        supplierId: z.string().optional(),
        category: z.enum(["Additivi", "Alcolici", "Bevande", "Birra", "Caffè", "Carni", "Farine", "Latticini", "Non Food", "Packaging", "Spezie", "Verdura", "Altro"]),
        unitType: z.enum(["u", "k"]),
        packageType: z.enum(["Sacco", "Busta", "Brick", "Cartone", "Scatola", "Bottiglia", "Barattolo", "Lattina", "Sfuso", "Fusto"]).optional(),
        department: z.enum(["Cucina", "Sala"]).optional(),
        packageQuantity: z.number(),
        packagePrice: z.number(),
        pricePerKgOrUnit: z.number(),
        minOrderQuantity: z.number().optional(),
        packageSize: z.number().optional(),
        brand: z.string().optional(),
        notes: z.string().optional(),
        isFood: z.boolean().optional(),
        isSoldByPackage: z.boolean().optional(),
        allergens: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const role = ctx.user?.role;
      if (role !== "admin" && role !== "manager" && role !== "superadmin") {
        throw new Error("Unauthorized");
      }
      const ingredientData = {
        supplierId: input.supplierId,
        category: input.category,
        unitType: input.unitType,
        packageType: input.packageType,
        department: input.department,
        packageQuantity: input.packageQuantity.toString(),
        packagePrice: input.packagePrice.toString(),
        pricePerKgOrUnit: input.pricePerKgOrUnit.toString(),
        minOrderQuantity: input.minOrderQuantity?.toString() || null,
        packageSize: input.packageSize?.toString() || null,
        brand: input.brand,
        notes: input.notes,
        isActive: true,
        isFood: input.isFood ?? true,
        isSoldByPackage: input.isSoldByPackage ?? false,
        allergens: input.allergens || [],
      };
      if (await isStoreGlobal(ctx.currentStoreId)) {
        const storeIds = await getAllActiveStoreIds();
        await updateIngredientAcrossStores(input.name, ingredientData as any, storeIds);
        return { ...ingredientData, id: input.id, name: input.name, storeId: "all" };
      }
      return db.createIngredient({
        ...ingredientData,
        id: input.id,
        name: input.name,
        storeId: ctx.currentStoreId || 'default-store-001',
      } as any);
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        supplier: z.string().optional(),
        supplierId: z.string().optional(),
        category: z.enum(["Additivi", "Alcolici", "Bevande", "Birra", "Caffè", "Carni", "Farine", "Latticini", "Non Food", "Packaging", "Spezie", "Verdura", "Altro"]).optional(),
        unitType: z.enum(["u", "k"]).optional(),
        packageType: z.enum(["Sacco", "Busta", "Brick", "Cartone", "Scatola", "Bottiglia", "Barattolo", "Lattina", "Sfuso", "Fusto"]).optional(),
        department: z.enum(["Cucina", "Sala"]).optional(),
        packageQuantity: z.number().optional(),
        packagePrice: z.number().optional(),
        pricePerKgOrUnit: z.number().optional(),
        minOrderQuantity: z.number().optional(),
        packageSize: z.number().optional(),
        brand: z.string().optional(),
        notes: z.string().optional(),
        isFood: z.boolean().optional(),
        isSoldByPackage: z.boolean().optional(),
        allergens: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const role = ctx.user?.role;
      if (role !== "admin" && role !== "manager" && role !== "superadmin") {
        throw new Error("Unauthorized");
      }

      // Get current ingredient data for recalculation
      const currentIngredient = await db.getIngredientById(input.id);
      if (!currentIngredient) {
        throw new Error("Ingredient not found");
      }
      
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.supplier !== undefined) updateData.supplier = input.supplier;
      if (input.supplierId !== undefined) updateData.supplierId = input.supplierId;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.unitType !== undefined) updateData.unitType = input.unitType;
      if (input.packageQuantity !== undefined) updateData.packageQuantity = input.packageQuantity.toString();
      if (input.packagePrice !== undefined) updateData.packagePrice = input.packagePrice.toString();
      
      // Auto-calculate pricePerKgOrUnit when packagePrice or packageQuantity changes
      if (input.packagePrice !== undefined || input.packageQuantity !== undefined) {
        const price = input.packagePrice ?? parseFloat(currentIngredient.packagePrice);
        const qty = input.packageQuantity ?? parseFloat(currentIngredient.packageQuantity);
        if (qty > 0) {
          updateData.pricePerKgOrUnit = (price / qty).toString();
        }
      }
      
      if (input.minOrderQuantity !== undefined) updateData.minOrderQuantity = input.minOrderQuantity.toString();
      if (input.packageSize !== undefined) updateData.packageSize = input.packageSize.toString();
      if (input.packageType !== undefined) updateData.packageType = input.packageType;
      if (input.department !== undefined) updateData.department = input.department;
      if (input.brand !== undefined) updateData.brand = input.brand;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.isFood !== undefined) updateData.isFood = input.isFood;
      if (input.isSoldByPackage !== undefined) updateData.isSoldByPackage = input.isSoldByPackage;
      if (input.allergens !== undefined) updateData.allergens = input.allergens;
      if (await isStoreGlobal(ctx.currentStoreId)) {
        const storeIds = await getAllActiveStoreIds();
        await updateIngredientAcrossStores(currentIngredient.name, updateData, storeIds);
        return;
      }
      return db.updateIngredient(input.id, updateData);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager" && ctx.user?.role !== "superadmin") {
        throw new Error("Unauthorized");
      }
      return db.deleteIngredient(input.id);
    }),
  exportToExcel: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
      throw new Error("Unauthorized");
    }
    const { exportIngredientsToExcel } = await import('./exportExcel.js');
    const ingredients = await db.getIngredients();
    
    try {
      const buffer = await exportIngredientsToExcel(ingredients);
      const base64 = buffer.toString('base64');
      
      return {
        filename: `ingredienti_${new Date().toISOString().split('T')[0]}.xlsx`,
        data: base64,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    } catch (error: any) {
      throw new Error(`Errore creazione Excel: ${error.message}`);
    }
  }),
  importFromExcel: protectedProcedure
    .input(z.object({
      fileData: z.string(), // base64
      filename: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      
      const { importIngredientsFromExcel } = await import('./exportExcel.js');
      
      try {
        // Decodifica file Excel
        const buffer = Buffer.from(input.fileData, 'base64');
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        const parsedData = await importIngredientsFromExcel(arrayBuffer);
        
        // Valida e importa dati
        let imported = 0;
        let errors: string[] = [];
        
        for (const row of parsedData) {
          try {
            // Cerca ingrediente esistente per nome
            const existing = await db.getIngredients();
            const match = existing.find((i: any) => i.name.toLowerCase() === row.name.toLowerCase());
            
            if (match) {
              // Aggiorna esistente
              const updateData: any = {
                packageQuantity: row.packageQuantity.toString(),
                packagePrice: row.packagePrice.toString(),
                pricePerKgOrUnit: row.pricePerKgOrUnit.toString(),
                category: row.category,
                isFood: row.isFood
              };
              if (row.brand) updateData.brand = row.brand;
              if (row.notes) updateData.notes = row.notes;
              
              await db.updateIngredient(match.id, updateData);
              imported++;
            } else {
              // Crea nuovo
              await db.createIngredient({
                id: crypto.randomBytes(16).toString('hex'),
                storeId: ctx.currentStoreId || 'default-store-001',
                name: row.name,
                supplierId: null,
                supplier: row.supplier || 'Non specificato',
                category: row.category,
                unitType: row.unit === 'kg' ? 'k' : 'u',
                packageType: null,
                department: 'Cucina',
                packageQuantity: row.packageQuantity.toString(),
                packagePrice: row.packagePrice.toString(),
                pricePerKgOrUnit: row.pricePerKgOrUnit.toString(),
                minOrderQuantity: null,
                packageSize: null,
                brand: row.brand || '',
                notes: row.notes || '',
                isFood: row.isFood,
                isActive: true,
                isOrderable: true,
                isSellable: true,
                isSalaItem: false,
                subcategory: null,
                allergens: row.allergens || []
              });
              imported++;
            }
          } catch (err: any) {
            errors.push(`Errore riga ${row.name}: ${err.message}`);
          }
        }
        
        return {
          success: true,
          imported,
          errors: errors.length > 0 ? errors : undefined
        };
      } catch (error: any) {
        console.error('Errore import Excel:', error);
        throw new Error(`Errore durante import Excel: ${error.message}`);
      }
    }),

  bulkUpdatePrices: protectedProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          packagePrice: z.number(),
          packageQuantity: z.number(),
          pricePerKgOrUnit: z.number(),
        })
      )
    )
    .mutation(async ({ input, ctx }) => {
      const role = ctx.user?.role;
      if (role !== "admin" && role !== "manager" && role !== "superadmin") {
        throw new Error("Unauthorized");
      }
      const isGlobal = await isStoreGlobal(ctx.currentStoreId);
      for (const item of input) {
        const updateData: Record<string, string> = {
          packagePrice: item.packagePrice.toString(),
          packageQuantity: item.packageQuantity.toString(),
          pricePerKgOrUnit: item.pricePerKgOrUnit.toString(),
        };
        if (isGlobal) {
          const storeIds = await getAllActiveStoreIds();
          await updateIngredientAcrossStores(item.name, updateData as any, storeIds);
        } else {
          await db.updateIngredient(item.id, updateData as any);
        }
      }
      return { success: true, updated: input.length };
    }),
});

// ============ PROCEDURE SEMILAVORATI ============
const semiFinishedRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getSemiFinishedRecipes(ctx.currentStoreId);
  }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getSemiFinishedById(input.id);
    }),
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        category: z.enum(["SPEZIE", "SALSE", "VERDURA", "CARNE", "ALTRO"]),
        finalPricePerKg: z.number(),
        yieldPercentage: z.number(),
        shelfLifeDays: z.number(),
        storageMethod: z.string(),
        totalQuantityProduced: z.number().optional(),
        components: z.any().optional(),
        productionSteps: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createSemiFinished({
        ...input,
        finalPricePerKg: input.finalPricePerKg.toString(),
        yieldPercentage: input.yieldPercentage.toString(),
        totalQuantityProduced: input.totalQuantityProduced?.toString() || null,
      } as any);
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        finalPricePerKg: z.number().optional(),
        yieldPercentage: z.number().optional(),
        shelfLifeDays: z.number().optional(),
        storageMethod: z.string().optional(),
        totalQuantityProduced: z.number().optional(),
        components: z.any().optional(),
        productionSteps: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      const updateData: any = {};
      if (input.finalPricePerKg !== undefined) updateData.finalPricePerKg = input.finalPricePerKg.toString();
      if (input.yieldPercentage !== undefined) updateData.yieldPercentage = input.yieldPercentage.toString();
      if (input.shelfLifeDays !== undefined) updateData.shelfLifeDays = input.shelfLifeDays;
      if (input.storageMethod !== undefined) updateData.storageMethod = input.storageMethod;
      if (input.totalQuantityProduced !== undefined) updateData.totalQuantityProduced = input.totalQuantityProduced.toString();
      if (input.components !== undefined) updateData.components = input.components;
      if (input.productionSteps !== undefined) updateData.productionSteps = input.productionSteps;
      return db.updateSemiFinished(input.id, updateData);
    }),
});

// ============ PROCEDURE FOOD MATRIX ============
const foodMatrixRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        tag: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return db.getFoodMatrixItems(ctx.currentStoreId, input);
    }),
  search: protectedProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ input }) => {
      return db.searchFoodMatrix(input.searchTerm);
    }),
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        recipeFinalId: z.string().optional(),
        semiFinishedId: z.string().optional(),
        categoryForMenu: z.enum(["Primi", "Secondi", "Contorni", "Dolci", "Bevande", "Altro"]),
        tag: z.enum(["Vegetariano", "Vegano", "Senza Glutine", "Senza Lattosio", "Altro"]),
        unitCost: z.number(),
        sellingPrice: z.number(),
        portionSize: z.number(),
        allergens: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createFoodMatrixItem({
        ...input,
        unitCost: input.unitCost.toString(),
        sellingPrice: input.sellingPrice.toString(),
        portionSize: input.portionSize.toString(),
      } as any);
    }),
});

// ============ PROCEDURE OPERAZIONI ============
const operationsRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getOperations();
  }),
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        costType: z.enum(["ENERGIA", "LAVORO"]),
        costPerHour: z.number(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createOperation({
        ...input,
        costPerHour: input.costPerHour.toString(),
      } as any);
    }),
});

// ============ PROCEDURE PRODUZIONI SETTIMANALI ============
const productionRouter = router({
  // Alias per compatibilità con codice esistente
  list: protectedProcedure
    .input(z.object({ weekStartDate: z.date().optional() }).optional())
    .query(async ({ input, ctx }) => {
      return db.getWeeklyProductions(input?.weekStartDate, ctx.currentStoreId);
    }),

  listWeekly: protectedProcedure
    .input(z.object({ weekStartDate: z.date().optional() }).optional())
    .query(async ({ input, ctx }) => {
      return db.getWeeklyProductions(input?.weekStartDate, ctx.currentStoreId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        recipeFinalId: z.string().optional(),
        semiFinishedId: z.string().optional(),
        productionType: z.enum(["final", "semifinished"]),
        quantity: z.number(),
        weekStartDate: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      const result = await db.createWeeklyProduction({
        id: crypto.randomUUID(),
        storeId: ctx.currentStoreId || 'default-store-001',
        recipeFinalId: input.recipeFinalId || null,
        semiFinishedId: input.semiFinishedId || null,
        productionType: input.productionType,
        quantity: input.quantity,
        weekStartDate: input.weekStartDate,
      } as any);
      
      // Aggiorna la quantità totale prodotta nella ricetta
      if (input.recipeFinalId) {
        await db.updateProducedQuantity(input.recipeFinalId);
      }
      
      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      const result = await db.deleteWeeklyProduction(input.id);
      
      // Aggiorna la quantità totale prodotta nella ricetta
      if (result.recipeFinalId) {
        await db.updateProducedQuantity(result.recipeFinalId);
      }
      
      return result;
    }),

  confirmWeeklyProduction: protectedProcedure
    .input(
      z.object({
        weekStartDate: z.date(),
        productions: z.array(
          z.object({
            recipeFinalId: z.string(),
            quantity: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }

      // Ottieni o crea scheda HACCP per la settimana
      const { getCurrentWeekHaccpSheet, createHaccpWeeklySheet, createProductionCheck } = await import("./haccpDb.js");
      let haccpSheet = await getCurrentWeekHaccpSheet();
      
      if (!haccpSheet) {
        const weekEnd = new Date(input.weekStartDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const sheetId = await createHaccpWeeklySheet({
          weekStartDate: input.weekStartDate,
          weekEndDate: weekEnd,
        });
        haccpSheet = { id: sheetId } as any;
      }
      
      const results = [];
      for (const prod of input.productions) {
        // Crea produzione
        const productionId = crypto.randomUUID();
        const result = await db.createWeeklyProduction({
          id: productionId,
          storeId: ctx.currentStoreId || 'default-store-001',
          recipeFinalId: prod.recipeFinalId,
          semiFinishedId: null,
          productionType: "final",
          quantity: prod.quantity,
          weekStartDate: input.weekStartDate,
        } as any);
        
        // Aggiorna la quantità totale prodotta nella ricetta
        await db.updateProducedQuantity(prod.recipeFinalId);
        
        // Ottieni nome ricetta
        const recipe = await db.getFinalRecipeById(prod.recipeFinalId);
        
        // Crea controllo HACCP automaticamente
        if (recipe && haccpSheet) {
          await createProductionCheck({
            haccpSheetId: haccpSheet.id,
            productionId: productionId,
            recipeName: recipe.name,
            quantityProduced: prod.quantity.toString(),
            isCompliant: true,
          });
        }
        
        results.push(result);
      }
      
      return { success: true, count: results.length };
    }),

  generateShoppingList: protectedProcedure
    .input(z.object({ weekStartDate: z.date().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const weekStartDate = input?.weekStartDate;
      const productions = await db.getWeeklyProductions(weekStartDate, ctx.currentStoreId);

      console.log('[generateShoppingList] Productions:', productions.length);

      // Carica TUTTI gli ingredienti e semilavorati
      const allIngredients = await db.getIngredients(ctx.currentStoreId);
      const allSemiFinished = await db.getSemiFinishedRecipes();

      // Mappa per aggregare quantità necessarie
      const ingredientNeeds = new Map<string, number>();
      const semiFinishedNeeds = new Map<string, number>();

      // Calcola quantità necessarie dalle produzioni
      for (const prod of productions) {
        let recipe = null;
        let quantity = parseFloat(prod.quantity);

        if (prod.recipeFinalId) {
          recipe = await db.getFinalRecipeById(prod.recipeFinalId);
        }

        if (!recipe) continue;

        let components: any[] = [];
        if (typeof recipe.components === 'string') {
          try {
            components = JSON.parse(recipe.components);
          } catch (e) {
            console.error('[generateShoppingList] JSON parse error:', e);
            components = [];
          }
        } else if (Array.isArray(recipe.components)) {
          components = recipe.components;
        }

        // Normalizza le quantità dei componenti per il peso unitario della ricetta
        const unitWeight = parseFloat(recipe.unitWeight || '1');
        
        for (const comp of components) {
          // comp.quantity è per unitWeight kg di output, quindi normalizziamo
          const quantityPerKg = comp.quantity / unitWeight;
          const totalNeeded = quantityPerKg * quantity;
          
          if (comp.type === 'ingredient') {
            const current = ingredientNeeds.get(comp.componentId) || 0;
            ingredientNeeds.set(comp.componentId, current + totalNeeded);
          } else if (comp.type === 'semi_finished') {
            const current = semiFinishedNeeds.get(comp.componentId) || 0;
            semiFinishedNeeds.set(comp.componentId, current + totalNeeded);
          }
        }
      }

      // Costruisci lista completa con TUTTI gli articoli
      const shoppingList = [];

      // Aggiungi tutti gli ingredienti ordinabili
      for (const ing of allIngredients) {
        const quantityNeeded = ingredientNeeds.get(ing.id) || 0;
        shoppingList.push({
          id: ing.id,
          itemName: ing.name,
          itemType: 'INGREDIENT',
          supplier: ing.supplier || ing.supplierName || 'N/A',
          category: ing.category,
          quantityNeeded,
          quantityToOrder: 0,
          unitType: ing.unitType || 'k',
          pricePerUnit: parseFloat(ing.pricePerKgOrUnit),
          packageType: ing.packageType || null,
          department: ing.department || 'Cucina',
          packageQuantity: ing.packageQuantity ? parseFloat(ing.packageQuantity) : null,
          isSoldByPackage: ing.isSoldByPackage ?? false,
          totalCost: 0,
          minOrderQuantity: ing.minOrderQuantity ? parseFloat(ing.minOrderQuantity) : null,
        });
      }

      // Aggiungi tutti i semilavorati dalla tabella semi_finished_recipes
      for (const semi of allSemiFinished) {
        const quantityNeeded = semiFinishedNeeds.get(semi.id) || 0;
        shoppingList.push({
          id: semi.id,
          itemName: semi.name,
          itemType: 'SEMI_FINISHED',
          supplier: 'Produzione Interna',
          category: semi.category || 'ALTRO',
          quantityNeeded,
          quantityToOrder: 0,
          unitType: 'k',
          pricePerUnit: parseFloat(semi.finalPricePerKg),
          totalCost: 0,
          minOrderQuantity: null,
        });
      }

      return shoppingList;
    }),
});

// ============ PROCEDURE MENU ============
const menuRouter = router({
  listTypes: protectedProcedure.query(async ({ ctx }) => {
    return db.getMenuTypes(ctx.currentStoreId);
  }),
  listItems: protectedProcedure
    .input(z.object({ menuTypeId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return db.getMenuItems(ctx.currentStoreId, input?.menuTypeId);
    }),
  createType: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createMenuType(input as any);
    }),
  createItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        menuTypeId: z.string(),
        foodMatrixId: z.string(),
        dayOfWeek: z.enum(["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]),
        estimatedPortions: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createMenuItem({
        ...input,
        estimatedPortions: input.estimatedPortions.toString(),
      } as any);
    }),
});

// ============ PROCEDURE RICETTE FINALI ============
const finalRecipesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Restituisce TUTTE le ricette (anche nascoste) per gestione nella pagina
    return db.getFinalRecipes(ctx.currentStoreId);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getFinalRecipeById(input.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        code: z.string(),
        category: z.enum(["Pane", "Carne", "Salse", "Verdure", "Formaggi", "Altro"]),
        yieldPercentage: z.number(),
        serviceWastePercentage: z.number(),
        conservationMethod: z.string(),
        maxConservationTime: z.string(),
        isSellable: z.boolean().optional(),
        isSemiFinished: z.boolean().optional(),
        components: z.array(
          z.object({
            type: z.enum(["ingredient", "semi_finished", "operation"]),
            componentId: z.string(),
            componentName: z.string(),
            quantity: z.number(),
            unit: z.string(),
            pricePerUnit: z.number().optional(),
            costType: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Solo admin e superadmin possono creare ricette
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "superadmin") {
        throw new Error("Unauthorized: Only admins can create recipes");
      }

      // Validazione dati ricetta
      const validation = validateRecipe(
        {
          name: input.name,
          code: input.code,
          category: input.category,
          yieldPercentage: input.yieldPercentage,
          serviceWastePercentage: input.serviceWastePercentage,
          conservationMethod: input.conservationMethod,
          maxConservationTime: input.maxConservationTime,
          isSellable: input.isSellable ?? true,
          isSemiFinished: input.isSemiFinished ?? false,
        },
        input.components.map(c => ({
          type: c.type,
          componentId: c.componentId,
          componentName: c.componentName,
          quantity: c.quantity,
          unit: c.unit,
          name: c.componentName,
          pricePerUnit: c.pricePerUnit || 0,
          costType: c.costType,
        }))
      );

      if (!validation.valid) {
        throw new Error(validation.error || 'Dati ricetta non validi');
      }

      // Verifica unicità codice
      const existing = await db.getFinalRecipeByCode(input.code);
      if (existing) {
        throw new Error("Codice ricetta già esistente");
      }

      // Calcola costo totale dai componenti
      const totalCost = input.components.reduce((sum, comp) => {
        const price = comp.pricePerUnit || 0;
        return sum + (comp.quantity * price);
      }, 0);

      const newId = crypto.randomUUID();
      const recipeData = {
        name: input.name,
        code: input.code,
        category: input.category,
        yieldPercentage: input.yieldPercentage.toString(),
        serviceWastePercentage: input.serviceWastePercentage.toString(),
        conservationMethod: input.conservationMethod,
        maxConservationTime: input.maxConservationTime,
        totalCost: totalCost.toFixed(2),
        components: JSON.stringify(input.components),
        unitType: "k",
        unitWeight: null,
        producedQuantity: null,
        measurementType: "weight_only",
        pieceWeight: null,
        productionOperations: null,
        serviceWastePerIngredient: null,
        isSemiFinished: input.isSemiFinished ?? false,
        isSellable: input.isSellable ?? true,
        isActive: true,
        sellingPrice: null,
      };
      if (await isStoreGlobal(ctx.currentStoreId)) {
        const storeIds = await getAllActiveStoreIds();
        await updateRecipeAcrossStores(input.name, recipeData as any, storeIds);
        return { ...recipeData, id: newId, storeId: "all" };
      }
      return db.createFinalRecipe({
        id: newId,
        storeId: ctx.currentStoreId || 'default-store-001',
        name: input.name,
        code: input.code,
        category: input.category,
        yieldPercentage: input.yieldPercentage.toString(),
        serviceWastePercentage: input.serviceWastePercentage.toString(),
        conservationMethod: input.conservationMethod,
        maxConservationTime: input.maxConservationTime,
        totalCost: totalCost.toFixed(2),
        components: JSON.stringify(input.components),
        unitType: "k",
        unitWeight: null,
        producedQuantity: null,
        measurementType: "weight_only",
        pieceWeight: null,
        productionOperations: null,
        serviceWastePerIngredient: null,
        isSemiFinished: input.isSemiFinished ?? false,
        isSellable: input.isSellable ?? true,
        isActive: true,
        sellingPrice: null,
      } as any);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        category: z.enum(["Pane", "Carne", "Salse", "Verdure", "Formaggi", "Altro"]).optional(),
        yieldPercentage: z.number().optional(),
        serviceWastePercentage: z.number().optional(),
        unitWeight: z.number().optional(),
        producedQuantity: z.number().optional(),
        measurementType: z.enum(["weight_only", "unit_only", "both"]).optional(),
        pieceWeight: z.number().optional(),
        isSemiFinished: z.boolean().optional(),
        isSellable: z.boolean().optional(),
        sellingPrice: z.number().optional(),
        components: z.array(
          z.object({
            type: z.enum(["ingredient", "semi_finished", "operation"]),
            componentId: z.string(),
            componentName: z.string(),
            quantity: z.number(),
            unit: z.string(),
            pricePerUnit: z.number().optional(),
            costType: z.string().optional(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const role = ctx.user?.role;
      // Solo admin e superadmin possono modificare ricette
      if (role !== "admin" && role !== "superadmin") {
        throw new Error("Unauthorized: Only admins can update recipes");
      }

      // Salva versione corrente prima di modificare
      const currentRecipe = await db.getFinalRecipeById(input.id);
      if (currentRecipe) {
        // Ottieni ultimo numero versione
        const lastVersion = await db.getLastRecipeVersion(input.id, "final");
        const newVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;
        
        // Salva snapshot
        await db.createRecipeVersion({
          recipeId: input.id,
          recipeType: "final",
          versionNumber: newVersionNumber,
          snapshot: currentRecipe,
          changedBy: ctx.user.openId,
          changeDescription: "Modifica automatica",
        });
      }

      const updateData: any = {
        name: input.name,
        category: input.category,
        yieldPercentage: input.yieldPercentage?.toString(),
        serviceWastePercentage: input.serviceWastePercentage?.toString(),
        unitWeight: input.unitWeight,
        producedQuantity: input.producedQuantity,
        measurementType: input.measurementType,
        pieceWeight: input.pieceWeight,
        isSemiFinished: input.isSemiFinished,
        isSellable: input.isSellable,
        sellingPrice: input.sellingPrice?.toString(),
      };

      // Se ci sono componenti, ricalcola totalCost
      if (input.components) {
        const totalCost = input.components.reduce((sum, comp) => {
          const price = comp.pricePerUnit || 0;
          return sum + (comp.quantity * price);
        }, 0);
        updateData.totalCost = totalCost.toFixed(2);
        updateData.components = JSON.stringify(input.components);
      }

      if (currentRecipe && await isStoreGlobal(ctx.currentStoreId)) {
        const storeIds = await getAllActiveStoreIds();
        await updateRecipeAcrossStores(currentRecipe.name, updateData, storeIds);
        return;
      }
      return db.updateFinalRecipe(input.id, updateData);
    }),

  getDetails: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const recipe = await db.getFinalRecipeById(input.id);
      if (!recipe) return null;

      // Parse JSON se necessario
      let parsedComponents = recipe.components;
      if (typeof recipe.components === 'string') {
        try {
          parsedComponents = JSON.parse(recipe.components);
        } catch (e) {
          console.error('[getDetails] JSON parse error:', e);
          parsedComponents = [];
        }
      }

      console.log('[getDetails] Recipe:', recipe.name);
      console.log('[getDetails] Parsed components length:', Array.isArray(parsedComponents) ? parsedComponents.length : 'N/A');

      // Espandi i componenti con dettagli ingredienti/semilavorati
      const components = Array.isArray(parsedComponents) ? parsedComponents : [];
      const componentsWithDetails = await Promise.all(
        components.map(async (comp: any) => {
          if (comp.type === 'ingredient') {
            const ingredient = await db.getIngredientById(comp.componentId);
            return {
              ...comp,
              name: ingredient?.name || 'Sconosciuto',
              unit: comp.unit || (ingredient?.unitType === 'u' ? 'unità' : 'kg'),
              pricePerUnit: ingredient?.pricePerKgOrUnit || 0,
            };
          } else if (comp.type === 'semi_finished') {
            const semiFinished = await db.getSemiFinishedById(comp.componentId);
            return {
              ...comp,
              name: semiFinished?.name || 'Sconosciuto',
              unit: comp.unit || 'kg',
              pricePerUnit: semiFinished?.finalPricePerKg || 0,
            };
          } else if (comp.type === 'operation') {
            const operation = await db.getOperationByName(comp.componentName || '');
            return {
              ...comp,
              name: operation?.name || comp.componentName || 'Sconosciuto',
              unit: comp.unit || 'ore',
              pricePerUnit: operation?.hourlyRate ? parseFloat(operation.hourlyRate) : 0,
              costType: operation?.costType || comp.costType || 'LAVORO',
            };
          }
          return comp;
        })
      );

      return {
        ...recipe,
        components: componentsWithDetails,
      };
    }),

  getVersions: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getRecipeVersions(input.id, "final");
    }),

  rollbackVersion: protectedProcedure
    .input(z.object({
      recipeId: z.string(),
      versionId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      // Solo admin può ripristinare versioni precedenti
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Only admins can rollback recipe versions");
      }

      // Recupera la versione richiestasta
      const versions = await db.getRecipeVersions(input.recipeId, "final");
      const targetVersion = versions.find(v => v.id === input.versionId);
      
      if (!targetVersion) {
        throw new Error("Versione non trovata");
      }

      // Salva versione corrente prima del rollback
      const currentRecipe = await db.getFinalRecipeById(input.recipeId);
      if (currentRecipe) {
        const lastVersion = await db.getLastRecipeVersion(input.recipeId, "final");
        const newVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;
        
        await db.createRecipeVersion({
          recipeId: input.recipeId,
          recipeType: "final",
          versionNumber: newVersionNumber,
          snapshot: currentRecipe,
          changedBy: ctx.user.openId,
          changeDescription: `Rollback alla versione ${targetVersion.versionNumber}`,
        });
      }

      // Ripristina la versione target
      const snapshot = targetVersion.snapshot as any;
      return db.updateFinalRecipe(input.recipeId, {
        category: snapshot.category,
        yieldPercentage: snapshot.yieldPercentage,
        serviceWastePercentage: snapshot.serviceWastePercentage,
        unitWeight: snapshot.unitWeight,
        producedQuantity: snapshot.producedQuantity,
        totalCost: snapshot.totalCost,
        components: snapshot.components,
        conservationMethod: snapshot.conservationMethod,
        maxConservationTime: snapshot.maxConservationTime,
      });
    }),

  getAllergens: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { calculateRecipeAllergens } = await import("./allergens");
      return calculateRecipeAllergens(input.id);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Solo admin può eliminare ricette
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Only admins can delete recipes");
      }
      return db.deleteFinalRecipe(input.id);
    }),

  toggleActive: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      isActive: z.boolean()
    }))
    .mutation(async ({ input, ctx }) => {
      // Solo admin può attivare/disattivare ricette
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Only admins can toggle recipe visibility");
      }

      return db.updateFinalRecipe(input.id, {
        isActive: input.isActive,
      });
    }),
});

// ============ PROCEDURE WASTE MANAGEMENT ============
const wasteRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        componentId: z.string().optional(),
        wasteType: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return db.getWasteRecords(ctx.currentStoreId, input);
    }),
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        componentId: z.string(),
        componentType: z.enum(["ingredient", "semi_finished", "final_recipe"]),
        wasteType: z.enum(["production", "service"]),
        quantity: z.number(),
        reason: z.string().optional(),
        recordedAt: z.date(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createWasteRecord({
        ...input,
        quantity: input.quantity.toString(),
      } as any);
    }),
});

// ============ PROCEDURE HACCP ============
const haccpRouter = router({
  listBatches: protectedProcedure.query(async ({ ctx }) => {
    return db.getProductionBatches(ctx.currentStoreId);
  }),
  listRecords: protectedProcedure.query(async ({ ctx }) => {
    return db.getHACCPRecords(ctx.currentStoreId);
  }),
  createBatch: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        recipeFinalId: z.string(),
        batchCode: z.string(),
        productionDate: z.date(),
        expiryDate: z.date(),
        quantityProduced: z.number(),
        storageLocation: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createProductionBatch({
        ...input,
        quantityProduced: input.quantityProduced.toString(),
      } as any);
    }),
  createRecord: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        batchId: z.string(),
        checkType: z.enum(["temperature", "ph", "visual", "other"]),
        checkValue: z.string(),
        checkResult: z.enum(["pass", "fail"]),
        notes: z.string().optional(),
        checkedBy: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createHACCPRecord(input as any);
    }),
});

// ============ PROCEDURE CLOUD STORAGE ============
const storageRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        documentType: z.string().optional(),
        relatedEntityId: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return db.getCloudStorageFiles(ctx.currentStoreId, input);
    }),
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
        documentType: z.enum(["haccp", "certificate", "batch_photo", "other"]),
        relatedEntityId: z.string().optional(),
        uploadedBy: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createCloudStorageFile(input as any);
    }),
});

// ============ PROCEDURE FORNITORI ============
const suppliersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getSuppliers(ctx.currentStoreId);
  }),
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        contact: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const role = ctx.user?.role;
      if (role !== "admin" && role !== "manager" && role !== "superadmin") {
        throw new Error("Unauthorized");
      }
      const { id, name, ...supplierData } = input;
      if (await isStoreGlobal(ctx.currentStoreId)) {
        const storeIds = await getAllActiveStoreIds();
        await updateSupplierAcrossStores(name, supplierData as any, storeIds);
        return { ...supplierData, id, name, storeId: "all" };
      }
      return db.createSupplier({ ...input, storeId: ctx.currentStoreId || 'default-store-001' } as any);
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        contact: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const role = ctx.user?.role;
      if (role !== "admin" && role !== "manager" && role !== "superadmin") {
        throw new Error("Unauthorized");
      }
      const { id, ...updateData } = input;
      if (input.name && await isStoreGlobal(ctx.currentStoreId)) {
        const storeIds = await getAllActiveStoreIds();
        await updateSupplierAcrossStores(input.name, updateData as any, storeIds);
        return;
      }
      return db.updateSupplier(id, updateData);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager" && ctx.user?.role !== "superadmin") {
        throw new Error("Unauthorized");
      }
      return db.deleteSupplier(input.id);
    }),
});

// ============ PROCEDURE STORICO ORDINI ============
const ordersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        weekId: z.string().optional(),
        limit: z.number().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      return db.getOrders({ ...input, storeId: ctx.currentStoreId });
    }),
  getItems: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      return db.getOrderItems(input.orderId);
    }),
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        weekId: z.string(),
        supplierId: z.string(),
        orderDate: z.date(),
        deliveryDate: z.date().optional(),
        totalAmount: z.number(),
        status: z.enum(["pending", "confirmed", "delivered", "cancelled"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createOrder({
        ...input,
        storeId: ctx.currentStoreId || 'default-store-001',
        totalAmount: input.totalAmount.toString(),
      } as any);
    }),
  createItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        orderId: z.string(),
        itemType: z.enum(["ingredient", "semifinished"]),
        itemId: z.string(),
        itemName: z.string(),
        quantity: z.number(),
        unit: z.string(),
        pricePerUnit: z.number(),
        totalPrice: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createOrderItem({
        ...input,
        quantity: input.quantity.toString(),
        pricePerUnit: input.pricePerUnit.toString(),
        totalPrice: input.totalPrice.toString(),
      } as any);
    }),
});

// ============ SISTEMA ROUTER ============
const systemRouter = router({
  notifyOwner: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Implementazione notifica owner (placeholder)
      console.log('[System] Notify owner:', input.title);
      return { success: true };
    }),
});

// ============ PROCEDURE GESTIONE UTENTI ============
const usersRouter = router({  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin" && ctx.user?.role !== "superadmin") {
      throw new Error("Unauthorized: Only admins can view users");
    }
    return db.getAllUsers();
  }),

  updateRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin", "manager", "cook", "superadmin"])
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "superadmin") {
        throw new Error("Unauthorized: Only admins can change user roles");
      }
      return db.updateUserRole(input.userId, input.role);
    }),

  updateStore: protectedProcedure
    .input(z.object({
      userId: z.number(),
      storeId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "superadmin") {
        throw new Error("Unauthorized: Only superadmin can change user store");
      }
      const { addUserToStore, removeUserFromStore, setUserPreferredStore, getUserStores } = await import("./storesDb.js");
      // Rimuovi utente da tutti gli store esistenti
      const currentStores = await getUserStores(input.userId);
      for (const s of currentStores) {
        await removeUserFromStore(input.userId, s.storeId);
      }
      // Aggiungi al nuovo store
      await addUserToStore(input.userId, input.storeId, "user");
      await setUserPreferredStore(input.userId, input.storeId);
      return { success: true };
    }),

  deduplicateIngredients: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user?.role !== "superadmin") {
        throw new Error("Unauthorized: Only superadmin can deduplicate ingredients");
      }
      return db.deduplicateIngredients();
    }),
});

import { auditLogRouter } from "./auditLogRouter";
import { multiStoreEditorRouter } from "./multiStoreEditorRouter";
import { foodMatrixV2Router } from "./foodMatrixV2Router";

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  stores: storesRouter,
  ingredients: ingredientsRouter,
  semiFinished: semiFinishedRouter,
  finalRecipes: finalRecipesRouter,
  foodMatrix: foodMatrixRouter,
  operations: operationsRouter,
  production: productionRouter,
  menu: menuRouter,
  waste: wasteRouter,
  haccp: haccpRouter,
  haccpSheets: haccpSheetRouter,
  fridges: fridgesRouter,
  invoices: invoicesRouter,
  nonConformities: nonConformitiesRouter,
  documents: documentsRouter,
  storage: storageRouter,
  suppliers: suppliersRouter,
  orders: ordersRouter,
  orderSessions: orderSessionsRouter,
  auditLog: auditLogRouter,
  multiStoreEditor: multiStoreEditorRouter,
  foodMatrixV2: foodMatrixV2Router,
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
