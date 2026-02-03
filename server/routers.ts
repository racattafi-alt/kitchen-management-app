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
        unitType: "k" as any,
        unitWeight: null,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.getFinalRecipeById(input.id);
    }),

  getDetails: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const recipe = await db.getFinalRecipeById(input.id);
      if (!recipe) return null;

      // Espandi i componenti con dettagli ingredienti/semilavorati
      const components = Array.isArray(recipe.components) ? recipe.components : [];
      const componentsWithDetails = await Promise.all(
        components.map(async (comp: any) => {
          if (comp.type === 'ingredient') {
            const ingredient = await db.getIngredientById(comp.componentId);
            return {
              ...comp,
              name: ingredient?.name || 'Sconosciuto',
              unit: ingredient?.unitType === 'u' ? 'Unità' : 'Kg',
              pricePerUnit: ingredient?.pricePerKgOrUnit || 0,
            };
          } else if (comp.type === 'semi_finished') {
            const semi = await db.getSemiFinishedById(comp.componentId);
            return {
              ...comp,
              name: semi?.name || 'Sconosciuto',
              unit: 'Kg',
              pricePerUnit: semi?.finalPricePerKg || 0,
            };
          }
          return comp;
        })
      );

      return {
        ...recipe,
        componentsWithDetails,
      };
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
      const productions = await db.getWeeklyProductions(input.weekStartDate);
      
      // Arricchisci con nomi ricette
      const enrichedProductions = await Promise.all(
        productions.map(async (prod: any) => {
          const recipe = await db.getFinalRecipeById(prod.recipeFinalId);
          return {
            ...prod,
            recipeName: recipe?.name || "Ricetta non trovata",
            recipeCode: recipe?.code || "",
          };
        })
      );
      
      return enrichedProductions;
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
        productionType: "FINAL_RECIPE",
        recipeFinalId: input.recipeFinalId,
        semiFinishedId: null,
        desiredQuantity: input.desiredQuantity.toString() as any,
        unitType: input.unitType,
        currentStock: "0",
        status: "PLANNED",
      });
    }),

  listWeekly: protectedProcedure.query(async () => {
    return db.getWeeklyProductions();
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.deleteWeeklyProduction(input.id);
    }),

    generateShoppingList: publicProcedure
    .input(z.object({ weekId: z.string().optional() }))
    .query(async ({ input }) => {
      // Funzione per calcolare il lunedì della settimana (in UTC)
      const getMondayOfWeek = (date: Date): string => {
        const d = new Date(date);
        // Usa UTC per evitare problemi di timezone
        const day = d.getUTCDay(); // 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato
        const diff = day === 0 ? -6 : 1 - day;
        d.setUTCDate(d.getUTCDate() + diff);
        return d.toISOString().split('T')[0];
      };

      // Ottieni tutte le produzioni della settimana (o tutte se weekId non specificato)
      const weeklyProductions = await db.getWeeklyProductions();
      const weekProductions = input.weekId 
        ? weeklyProductions.filter((p: any) => {
            // weekId è il lunedì della settimana (es. "2026-02-02")
            // Calcoliamo il lunedì della settimana di questa produzione
            const prodMondayKey = getMondayOfWeek(new Date(p.weekStartDate));
            return prodMondayKey === input.weekId || p.id === input.weekId;
          })
        : weeklyProductions;
      
      if (!weekProductions || weekProductions.length === 0) {
        return [];
      }

      // Prepara le produzioni per l'aggregazione
      const plannedProductions = [];
      
      for (const production of weekProductions) {
        let recipe: any;
        let components: any[];
        let yieldPercentage: number;
        let unitType: string;
        let unitWeight: number | null;
        let recipeName: string;

        // Carica ricetta finale o semilavorato in base al tipo
        if (production.productionType === 'SEMI_FINISHED' && production.semiFinishedId) {
          recipe = await db.getSemiFinishedById(production.semiFinishedId);
          if (!recipe || !recipe.components) {
            console.log(`[generateShoppingList] Semilavorato ${production.semiFinishedId} non trovato o senza componenti`);
            continue;
          }
          recipeName = recipe.name;
          yieldPercentage = Number(recipe.yieldPercentage || 1);
          unitType = 'k';
          unitWeight = null;
        } else if (production.recipeFinalId) {
          recipe = await db.getFinalRecipeById(production.recipeFinalId);
          if (!recipe || !recipe.components) {
            console.log(`[generateShoppingList] Ricetta ${production.recipeFinalId} non trovata o senza componenti`);
            continue;
          }
          recipeName = recipe.name;
          yieldPercentage = Number(recipe.yieldPercentage || 1);
          unitType = recipe.unitType || 'k';
          unitWeight = recipe.unitWeight || null;
        } else {
          console.log(`[generateShoppingList] Produzione senza recipeFinalId o semiFinishedId`);
          continue;
        }

        components = typeof recipe.components === 'string' 
          ? JSON.parse(recipe.components) 
          : recipe.components;

        if (!Array.isArray(components) || components.length === 0) {
          console.log(`[generateShoppingList] ${recipeName} ha componenti vuoti`);
          continue;
        }

        // Converti i componenti nel formato richiesto da aggregateProductionRequirements
        const formattedComponents = components.map((comp: any) => ({
          type: comp.type as "INGREDIENT" | "SEMI_FINISHED",
          componentId: comp.componentId,
          quantity: Number(comp.quantity || 0),
          unit: comp.unit || "k",
          wastePercentage: Number(comp.wastePercentage || 0),
        }));

        console.log(`[generateShoppingList] ${recipeName}: ${formattedComponents.length} componenti`);

        // Converti unità in kg se necessario
        let desiredQuantityInKg = Number(production.desiredQuantity || 1);
        if (unitType === 'u' && unitWeight) {
          // Quantità in unità * peso unitario (g) / 1000 = kg
          desiredQuantityInKg = desiredQuantityInKg * Number(unitWeight) / 1000;
          console.log(`[generateShoppingList] Conversione: ${production.desiredQuantity} unità × ${unitWeight}g = ${desiredQuantityInKg} kg`);
        }

        plannedProductions.push({
          recipeFinalId: production.recipeFinalId || production.semiFinishedId || '',
          desiredQuantity: desiredQuantityInKg,
          components: formattedComponents,
          yieldPercentage,
        });
      }

      // Usa la funzione di aggregazione
      const { aggregateProductionRequirements } = await import("./calculations");
      const { ingredients, semiFinished } = await aggregateProductionRequirements(plannedProductions);

      const shoppingList = [];
      
      // Aggiungi ingredienti
      for (const [ingredientId, quantityInKg] of Array.from(ingredients.entries())) {
        const ingredient = await db.getIngredientById(ingredientId);
        if (!ingredient) continue;

        const pricePerKg = Number(ingredient.pricePerKgOrUnit || 0);
        
        // Arrotonda per ingredienti unitari (uova, ecc.)
        let finalQuantity = quantityInKg;
        if (ingredient.unitType === 'u') {
          finalQuantity = Math.ceil(quantityInKg);
        }
        
        const totalCost = finalQuantity * pricePerKg;

        shoppingList.push({
          id: ingredient.id,
          itemName: ingredient.name,
          itemType: 'INGREDIENT' as const,
          category: ingredient.category,
          supplier: ingredient.supplier,
          quantityNeeded: finalQuantity,
          unitType: ingredient.unitType,
          pricePerUnit: pricePerKg,
          totalCost,
        });
      }
      
      // Aggiungi semilavorati
      for (const [semiId, quantityInKg] of Array.from(semiFinished.entries())) {
        const semi = await db.getSemiFinishedById(semiId);
        if (!semi) continue;

        const pricePerKg = Number(semi.finalPricePerKg || 0);
        const totalCost = quantityInKg * pricePerKg;

        shoppingList.push({
          id: semi.id,
          itemName: semi.name,
          itemType: 'SEMI_FINISHED' as const,
          category: semi.category,
          supplier: 'Produzione Interna',
          quantityNeeded: quantityInKg,
          unitType: 'k' as const,
          pricePerUnit: pricePerKg,
          totalCost,
        });
      }

      // Ordina per fornitore e poi per nome
      return shoppingList.sort((a, b) => {
        if (a.supplier !== b.supplier) {
          return a.supplier.localeCompare(b.supplier);
        }
        return a.itemName.localeCompare(b.itemName);
      });
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
      const { ingredients, semiFinished } = await aggregateProductionRequirements(input.productions);
      return {
        ingredients: Object.fromEntries(ingredients),
        semiFinished: Object.fromEntries(semiFinished),
      };
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
