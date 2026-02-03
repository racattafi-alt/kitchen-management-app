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

// ============ PROCEDURE FORNITORI ============
const suppliersRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getSuppliers();
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        contact: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createSupplier({
        id: nanoid(),
        name: input.name,
        contact: input.contact || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        notes: input.notes || null,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          contact: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.updateSupplier(input.id, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.deleteSupplier(input.id);
    }),

  linkIngredientsToSuppliers: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: only admin can link ingredients");
    }

    // Carica tutti i fornitori e ingredienti
    const allSuppliers = await db.getSuppliers();
    const allIngredients = await db.getIngredients();

    // Crea mappa nome fornitore -> ID
    const supplierMap = new Map(allSuppliers.map(s => [s.name, s.id]));

    // Aggiorna ogni ingrediente con supplierId
    let updated = 0;
    let skipped = 0;

    for (const ingredient of allIngredients) {
      if (!ingredient.supplierName) {
        skipped++;
        continue;
      }

      const supplierId = supplierMap.get(ingredient.supplierName || "");
      if (supplierId) {
        await db.updateIngredient(ingredient.id, { supplierId });
        updated++;
      } else {
        console.warn(`Fornitore non trovato per ingrediente ${ingredient.name}: ${ingredient.supplierName}`);
        skipped++;
      }
    }

    return {
      success: true,
      updated,
      skipped,
      total: allIngredients.length,
    };
  }),

  migrateFromIngredients: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized: only admin can migrate suppliers");
    }

    // Estrai fornitori unici dagli ingredienti
    const ingredients = await db.getIngredients();
    const uniqueSuppliers = Array.from(new Set(ingredients.map(i => i.supplierName).filter(Boolean)));

    // Inserisci i fornitori nella tabella suppliers
    const created = [];
    for (const supplierName of uniqueSuppliers) {
      if (!supplierName) continue;
      try {
        const supplier = await db.createSupplier({
          id: nanoid(),
          name: supplierName,
          contact: null,
          email: null,
          phone: null,
          address: null,
          notes: null,
        });
        created.push(supplier);
      } catch (error) {
        // Ignora duplicati
        console.warn(`Fornitore ${supplierName} già esistente`);
      }
    }

    return {
      success: true,
      created: created.length,
      total: uniqueSuppliers.length,
    };
  }),
});

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
        supplierId: null,
        supplier: input.supplier,
        category: input.category,
        unitType: input.unitType,
        packageQuantity: input.packageQuantity.toString() as any,
        packagePrice: input.packagePrice.toString() as any,
        pricePerKgOrUnit: pricePerKgOrUnit.toString() as any,
        minOrderQuantity: input.minOrderQuantity ? input.minOrderQuantity.toString() as any : null,
        packageSize: null,
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
          name: z.string().optional(),
          supplierId: z.string().optional(),
          category: z.enum(["Additivi", "Carni", "Farine", "Latticini", "Verdura", "Spezie", "Altro"]).optional(),
          unitType: z.enum(["u", "k"]).optional(),
          packagePrice: z.number().optional(),
          packageQuantity: z.number().optional(),
          packageSize: z.number().optional(),
          brand: z.string().optional(),
          notes: z.string().optional(),
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
      if (input.data.supplierId) updateData.supplierId = input.data.supplierId;
      if (input.data.category) updateData.category = input.data.category;
      if (input.data.unitType) updateData.unitType = input.data.unitType;
      if (input.data.packagePrice !== undefined) updateData.packagePrice = input.data.packagePrice.toString();
      if (input.data.packageQuantity !== undefined) updateData.packageQuantity = input.data.packageQuantity.toString();
      if (input.data.packageSize !== undefined) updateData.packageSize = input.data.packageSize.toString();
      if (input.data.brand !== undefined) updateData.brand = input.data.brand || null;
      if (input.data.notes !== undefined) updateData.notes = input.data.notes || null;
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        category: z.enum(["Pane", "Carne", "Salse", "Verdure", "Formaggi", "Altro"]).optional(),
        yieldPercentage: z.number().optional(),
        serviceWastePercentage: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.updateFinalRecipe(input.id, {
        category: input.category,
        yieldPercentage: input.yieldPercentage?.toString() as any,
        serviceWastePercentage: input.serviceWastePercentage?.toString() as any,
      });
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
            const semi = await db.getSemiFinishedById(comp.componentId);
            return {
              ...comp,
              name: semi?.name || 'Sconosciuto',
              unit: comp.unit || 'kg',
              pricePerUnit: semi?.finalPricePerKg || 0,
            };
          } else if (comp.type === 'operation') {
            // Recupera dettagli operation dalla tabella
            const operation = await db.getOperationByName(comp.componentName);
            return {
              ...comp,
              name: operation?.name || comp.componentName || 'Operazione',
              unit: comp.unit || 'ore',
              pricePerUnit: operation?.hourlyRate ? parseFloat(operation.hourlyRate) : 0,
              costType: operation?.costType || 'LAVORO',
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

      // Carica TUTTI gli ingredienti e semilavorati
      const allIngredients = await db.getIngredients();
      const allSemiFinished = await db.getSemiFinishedRecipes();
      
      const shoppingList = [];
      
      // Aggiungi TUTTI gli ingredienti (anche quelli non necessari)
      for (const ingredient of allIngredients) {
        const quantityInKg = ingredients.get(ingredient.id) || 0;
        const pricePerKg = Number(ingredient.pricePerKgOrUnit || 0);
        
        // Arrotonda per ingredienti unitari (uova, ecc.)
        let finalQuantity = quantityInKg;
        if (ingredient.unitType === 'u' && quantityInKg > 0) {
          finalQuantity = Math.ceil(quantityInKg);
        }
        
        const totalCost = finalQuantity * pricePerKg;

        shoppingList.push({
          id: ingredient.id,
          itemName: ingredient.name,
          itemType: 'INGREDIENT' as const,
          category: ingredient.category,
          supplier: ingredient.supplierName || 'Non specificato',
          quantityNeeded: finalQuantity,
          quantityToOrder: 0, // Valore iniziale 0, editabile dall'utente
          unitType: ingredient.unitType,
          pricePerUnit: pricePerKg,
          totalCost,
        });
      }
      
      // Aggiungi TUTTI i semilavorati (anche quelli non necessari)
      for (const semi of allSemiFinished) {
        const quantityInKg = semiFinished.get(semi.id) || 0;
        const pricePerKg = Number(semi.finalPricePerKg || 0);
        const totalCost = quantityInKg * pricePerKg;

        shoppingList.push({
          id: semi.id,
          itemName: semi.name,
          itemType: 'SEMI_FINISHED' as const,
          category: semi.category,
          supplier: 'Produzione Interna',
          quantityNeeded: quantityInKg,
          quantityToOrder: 0, // Valore iniziale 0, editabile dall'utente
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

  generateSupplierOrderPDF: protectedProcedure
    .input(
      z.object({
        shoppingList: z.array(
          z.object({
            id: z.string(),
            itemName: z.string(),
            itemType: z.string(),
            supplier: z.string(),
            quantityToOrder: z.number(),
            unitType: z.string(),
            pricePerUnit: z.number(),
            totalCost: z.number(),
          })
        ),
        weekId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { generateOrderPDF } = await import("./generateOrderPDF");
      
      // Raggruppa per fornitore
      const supplierMap = new Map<string, any[]>();
      for (const item of input.shoppingList) {
        if (item.quantityToOrder > 0) {
          if (!supplierMap.has(item.supplier)) {
            supplierMap.set(item.supplier, []);
          }
          supplierMap.get(item.supplier)!.push(item);
        }
      }

      // Prepara ordini per fornitore
      const supplierOrders = Array.from(supplierMap.entries()).map(([supplierName, items]) => ({
        supplierName,
        items,
        totalCost: items.reduce((sum, item) => sum + item.totalCost, 0),
      }));

      // Genera PDF
      const pdfBuffer = await generateOrderPDF(supplierOrders);
      
      // Salva ordine nel database
      const totalCost = supplierOrders.reduce((sum, order) => sum + order.totalCost, 0);
      const orderId = nanoid();
      
      await db.createOrder({
        id: orderId,
        orderDate: new Date(),
        weekId: input.weekId || null,
        totalCost: totalCost.toString() as any,
        pdfUrl: null,
        whatsappSent: true,
        notes: null,
        createdBy: ctx.user?.openId || 'unknown',
      });
      
      // Salva items dell'ordine
      for (const item of input.shoppingList) {
        if (item.quantityToOrder > 0) {
          await db.createOrderItem({
            id: nanoid(),
            orderId,
            itemType: item.itemType as any,
            itemId: item.id,
            itemName: item.itemName,
            supplier: item.supplier,
            quantityOrdered: item.quantityToOrder.toString() as any,
            unitType: item.unitType as any,
            pricePerUnit: item.pricePerUnit.toString() as any,
            totalCost: item.totalCost.toString() as any,
          });
        }
      }
      
      // Converti in base64 per il frontend
      return {
        pdf: pdfBuffer.toString('base64'),
        supplierOrders,
        orderId,
      };
    }),
  
  // Storico ordini
  listOrders: protectedProcedure
    .input(
      z.object({
        weekId: z.string().optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return db.getOrders(input);
    }),
  
  getOrderDetails: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      return db.getOrderItems(input.orderId);
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

  suppliers: suppliersRouter,
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
