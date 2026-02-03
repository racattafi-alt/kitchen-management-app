import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import {
  calculateRecipeCost,
  aggregateProductionRequirements,
  calculateMenuItemCost,
  calculatePromotionCost,
} from "./calculations";

// ============ PROCEDURE INGREDIENTI ============
const ingredientsRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getIngredients();
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        supplier: z.string(),
        category: z.enum(["Additivi", "Carni", "Farine", "Latticini", "Verdura", "Spezie", "Altro"]),
        unitType: z.enum(["u", "k"]),
        packageQuantity: z.number(),
        packagePrice: z.number(),
        minOrderQuantity: z.number().optional(),
        brand: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      const pricePerKgOrUnit = input.packagePrice / input.packageQuantity;
      return db.createIngredient({
        id: nanoid(),
        name: input.name,
        supplier: input.supplier,
        category: input.category,
        unitType: input.unitType,
        packageQuantity: input.packageQuantity.toString() as any,
        packagePrice: input.packagePrice.toString() as any,
        pricePerKgOrUnit: pricePerKgOrUnit.toString() as any,
        minOrderQuantity: input.minOrderQuantity ? input.minOrderQuantity.toString() as any : null,
        brand: input.brand || null,
        notes: input.notes || null,
        isActive: true,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          packagePrice: z.number().optional(),
          packageQuantity: z.number().optional(),
          name: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      const ingredient = await db.getIngredientById(input.id);
      if (!ingredient) throw new Error("Ingredient not found");

      const packagePrice = input.data.packagePrice ?? (ingredient.packagePrice as any);
      const packageQuantity = input.data.packageQuantity ?? (ingredient.packageQuantity as any);
      const pricePerKgOrUnit = packagePrice / packageQuantity;

      const updateData: any = {
        pricePerKgOrUnit: pricePerKgOrUnit.toString(),
      };
      if (input.data.name) updateData.name = input.data.name;
      if (input.data.packagePrice) updateData.packagePrice = input.data.packagePrice.toString();
      if (input.data.packageQuantity) updateData.packageQuantity = input.data.packageQuantity.toString();
      return db.updateIngredient(input.id, updateData);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return db.deleteIngredient(input.id);
    }),
});

// ============ PROCEDURE SEMILAVORATI ============
const semiFinishedRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getSemiFinishedRecipes();
  }),

  create: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        name: z.string(),
        category: z.enum(["SPEZIE", "SALSE", "VERDURA", "CARNE", "ALTRO"]),
        yieldPercentage: z.number(),
        shelfLifeDays: z.number(),
        storageMethod: z.string(),
        components: z.array(z.any()),
        productionSteps: z.array(z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      const finalPricePerKg = await calculateRecipeCost(
        input.components,
        input.productionSteps,
        input.yieldPercentage
      );
      return db.createSemiFinished({
        id: nanoid(),
        code: input.code,
        name: input.name,
        category: input.category,
        yieldPercentage: input.yieldPercentage.toString() as any,
        shelfLifeDays: input.shelfLifeDays,
        storageMethod: input.storageMethod,
        components: input.components as any,
        productionSteps: input.productionSteps as any,
        finalPricePerKg: finalPricePerKg.toString() as any,
        totalQuantityProduced: null,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getSemiFinishedById(input.id);
    }),
});

// ============ PROCEDURE RICETTE FINALI ============
const finalRecipesRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getFinalRecipes();
  }),

  create: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        name: z.string(),
        category: z.enum(["Pane", "Carne", "Salse", "Verdure", "Formaggi", "Altro"]),
        components: z.array(z.any()),
        yieldPercentage: z.number(),
        productionOperations: z.array(z.any()),
        conservationMethod: z.string(),
        maxConservationTime: z.string(),
        serviceWastePercentage: z.number().optional(),
        serviceWastePerIngredient: z.array(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      const totalCost = await calculateRecipeCost(
        input.components,
        input.productionOperations,
        input.yieldPercentage
      );
      return db.createFinalRecipe({
        id: nanoid(),
        code: input.code,
        name: input.name,
        category: input.category,
        components: input.components as any,
        yieldPercentage: input.yieldPercentage.toString() as any,
        productionOperations: input.productionOperations as any,
        conservationMethod: input.conservationMethod,
        maxConservationTime: input.maxConservationTime,
        serviceWastePercentage: (input.serviceWastePercentage || 0).toString() as any,
        serviceWastePerIngredient: input.serviceWastePerIngredient as any,
        totalCost: totalCost.toString() as any,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getFinalRecipeById(input.id);
    }),
});

// ============ PROCEDURE FOOD MATRIX ============
const foodMatrixRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        tag: z.enum(["FIC", "AQ"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getFoodMatrixItems(input);
    }),

  search: protectedProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ input }) => {
      return db.searchFoodMatrix(input.searchTerm);
    }),
});

// ============ PROCEDURE PRODUZIONI SETTIMANALI ============
const productionRouter = router({
  list: protectedProcedure
    .input(z.object({ weekStartDate: z.date().optional() }))
    .query(async ({ input }) => {
      return db.getWeeklyProductions(input.weekStartDate);
    }),

  create: protectedProcedure
    .input(
      z.object({
        weekStartDate: z.date(),
        recipeFinalId: z.string(),
        desiredQuantity: z.number(),
        unitType: z.enum(["u", "k"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createWeeklyProduction({
        id: nanoid(),
        weekStartDate: input.weekStartDate,
        recipeFinalId: input.recipeFinalId,
        desiredQuantity: input.desiredQuantity.toString() as any,
        unitType: input.unitType,
        currentStock: "0",
        status: "PLANNED",
      });
    }),

  listWeekly: protectedProcedure.query(async () => {
    return db.getWeeklyProductions();
  }),

  generateShoppingList: protectedProcedure
    .input(z.object({ weekId: z.string() }))
    .query(async ({ input }) => {
      // Ottieni le produzioni della settimana
      const productions = await db.getWeeklyProductions();
      const weekProduction = productions.find((p: any) => p.id === input.weekId);
      
      if (!weekProduction) {
        return [];
      }

      // Ottieni la ricetta finale
      const recipe = await db.getFinalRecipeById(weekProduction.recipeFinalId);
      if (!recipe || !recipe.components) {
        return [];
      }

      // Espandi i componenti e aggrega per ingrediente
      const components = typeof recipe.components === 'string' 
        ? JSON.parse(recipe.components) 
        : recipe.components;

      const ingredientMap = new Map();

      for (const component of components) {
        const ingredient = await db.getIngredientById(component.ingredientId);
        if (!ingredient) continue;

        const quantityNeeded = Number(component.quantity || 0) * Number(weekProduction.desiredQuantity || 1);
        const pricePerUnit = Number(ingredient.pricePerKgOrUnit || 0);
        const totalCost = quantityNeeded * pricePerUnit;

        const key = ingredient.id;
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key);
          existing.quantityNeeded += quantityNeeded;
          existing.totalCost += totalCost;
        } else {
          ingredientMap.set(key, {
            id: ingredient.id,
            ingredientName: ingredient.name,
            category: ingredient.category,
            supplier: ingredient.supplier,
            quantityNeeded,
            unitType: ingredient.unitType,
            pricePerUnit,
            totalCost,
          });
        }
      }

      return Array.from(ingredientMap.values());
    }),

  aggregateRequirements: protectedProcedure
    .input(
      z.object({
        productions: z.array(
          z.object({
            recipeFinalId: z.string(),
            desiredQuantity: z.number(),
            components: z.array(z.any()),
            yieldPercentage: z.number(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      const requirements = await aggregateProductionRequirements(input.productions);
      return Object.fromEntries(requirements);
    }),
});

// ============ PROCEDURE MENU ============
const menuRouter = router({
  listTypes: protectedProcedure.query(async () => {
    return db.getMenuTypes();
  }),

  createType: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        serviceType: z.enum(["DINE_IN", "DELIVERY", "TAKEAWAY", "EVENT"]),
        fixedCosts: z.array(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createMenuType({
        id: nanoid(),
        name: input.name,
        serviceType: input.serviceType,
        fixedCosts: input.fixedCosts || null,
      });
    }),

  listItems: protectedProcedure
    .input(z.object({ menuTypeId: z.string().optional() }))
    .query(async ({ input }) => {
      return db.getMenuItems(input.menuTypeId);
    }),

  createItem: protectedProcedure
    .input(
      z.object({
        menuTypeId: z.string(),
        name: z.string(),
        category: z.enum(["PANINI", "CARNE_AL_PIATTO", "INSALATE", "BEVANDE", "PROMOZIONI"]),
        components: z.array(z.any()),
        suggestedSalePrice: z.number(),
        actualSalePrice: z.number(),
        isPromotion: z.boolean().optional(),
        promotionComponents: z.array(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createMenuItem({
        id: nanoid(),
        menuTypeId: input.menuTypeId,
        name: input.name,
        category: input.category,
        components: input.components as any,
        suggestedSalePrice: input.suggestedSalePrice.toString() as any,
        actualSalePrice: input.actualSalePrice.toString() as any,
        isPromotion: input.isPromotion || false,
        promotionComponents: input.promotionComponents as any,
      });
    }),

  calculateCost: protectedProcedure
    .input(
      z.object({
        components: z.array(z.any()),
        salePrice: z.number(),
      })
    )
    .query(async ({ input }) => {
      return calculateMenuItemCost(input.components, input.salePrice);
    }),
});

// ============ PROCEDURE WASTE MANAGEMENT ============
const wasteRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        componentId: z.string().optional(),
        wasteType: z.enum(["PRODUCTION", "SERVICE"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getWasteRecords(input);
    }),

  record: protectedProcedure
    .input(
      z.object({
        productionBatchId: z.string().optional(),
        componentId: z.string(),
        wasteType: z.enum(["PRODUCTION", "SERVICE"]),
        wastePercentage: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createWasteRecord({
        id: nanoid(),
        componentId: input.componentId,
        wasteType: input.wasteType,
        wastePercentage: input.wastePercentage.toString() as any,
        productionBatchId: input.productionBatchId || null,
        notes: input.notes || null,
        recordedAt: new Date(),
      });
    }),
});

// ============ PROCEDURE HACCP ============
const haccpRouter = router({
  listBatches: protectedProcedure.query(async () => {
    return db.getProductionBatches();
  }),

  createBatch: protectedProcedure
    .input(
      z.object({
        recipeFinalId: z.string(),
        plannedDate: z.date(),
        quantity: z.number(),
        unitType: z.enum(["u", "k"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      const batchCode = `BATCH-${Date.now()}-${nanoid(6)}`;
      return db.createProductionBatch({
        id: nanoid(),
        batchCode,
        recipeFinalId: input.recipeFinalId,
        plannedDate: input.plannedDate,
        quantity: input.quantity.toString() as any,
        unitType: input.unitType,
        status: "PLANNED",
      });
    }),

  listHACCP: protectedProcedure.query(async () => {
    return db.getHACCPRecords();
  }),

  createHACCP: protectedProcedure
    .input(
      z.object({
        productionBatchId: z.string(),
        recipeName: z.string(),
        batchId: z.string(),
        plannedDate: z.date(),
        ingredients: z.array(z.any()),
        checkpoints: z.array(z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createHACCPRecord({
        id: nanoid(),
        productionBatchId: input.productionBatchId,
        recipeName: input.recipeName,
        batchId: input.batchId,
        plannedDate: input.plannedDate,
        ingredients: input.ingredients as any,
        checkpoints: input.checkpoints as any,
        operatorSignature: null,
        managerVerification: null,
        storageUrl: null,
      });
    }),
});

// ============ PROCEDURE CLOUD STORAGE ============
const storageRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        documentType: z.string().optional(),
        relatedEntityId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getCloudStorageFiles(input);
    }),

  upload: protectedProcedure
    .input(
      z.object({
        fileKey: z.string(),
        fileUrl: z.string(),
        documentType: z.enum(["HACCP", "SUPPLIER_CERT", "BATCH_PHOTO", "COMPLIANCE"]),
        relatedEntityId: z.string().optional(),
        relatedEntityType: z.enum(["PRODUCTION_BATCH", "INGREDIENT", "RECIPE"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return db.createCloudStorageFile({
        id: nanoid(),
        fileKey: input.fileKey,
        fileUrl: input.fileUrl,
        documentType: input.documentType,
        relatedEntityId: input.relatedEntityId || null,
        relatedEntityType: input.relatedEntityType || null,
        uploadedBy: ctx.user?.id?.toString() || "unknown",
      });
     }),
});

// ============ PROCEDURE ASSISTENTE AI ============
const assistantRouter = router({
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        context: z.object({
          ingredients: z.array(z.any()).optional(),
          recipes: z.array(z.any()).optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const responses = [
        "Posso aiutarti a ottimizzare il food cost delle tue ricette.",
        "Per ridurre i costi, considera di sostituire ingredienti premium con alternative locali.",
        "La struttura gerarchica delle ricette permette un calcolo preciso dei costi.",
      ];
      return {
        response: responses[Math.floor(Math.random() * responses.length)],
        suggestions: [],
      };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  ingredients: ingredientsRouter,
  semiFinished: semiFinishedRouter,
  finalRecipes: finalRecipesRouter,
  foodMatrix: foodMatrixRouter,
  production: productionRouter,
  menu: menuRouter,
  waste: wasteRouter,
  haccp: haccpRouter,
    storage: storageRouter,
  assistant: assistantRouter,
});
export type AppRouter = typeof appRouter;
