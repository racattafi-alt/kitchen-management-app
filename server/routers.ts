import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import crypto from "crypto";

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
  list: protectedProcedure.query(async () => {
    return db.getIngredients();
  }),
  create: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        supplierId: z.string().optional(),
        category: z.enum(["Additivi", "Alcolici", "Bevande", "Birra", "Carni", "Farine", "Latticini", "Non Food", "Packaging", "Spezie", "Verdura", "Altro"]),
        unitType: z.enum(["u", "k"]),
        packageQuantity: z.number(),
        packagePrice: z.number(),
        pricePerKgOrUnit: z.number(),
        minOrderQuantity: z.number().optional(),
        packageSize: z.number().optional(),
        brand: z.string().optional(),
        notes: z.string().optional(),
        isFood: z.boolean().optional(),
        allergens: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createIngredient({
        ...input,
        packageQuantity: input.packageQuantity.toString(),
        packagePrice: input.packagePrice.toString(),
        pricePerKgOrUnit: input.pricePerKgOrUnit.toString(),
        minOrderQuantity: input.minOrderQuantity?.toString() || null,
        packageSize: input.packageSize?.toString() || null,
        isActive: true,
        isFood: input.isFood ?? true,
        allergens: input.allergens || [],
      } as any);
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        supplierId: z.string().optional(),
        category: z.enum(["Additivi", "Alcolici", "Bevande", "Birra", "Carni", "Farine", "Latticini", "Non Food", "Packaging", "Spezie", "Verdura", "Altro"]).optional(),
        unitType: z.enum(["u", "k"]).optional(),
        packageQuantity: z.number().optional(),
        packagePrice: z.number().optional(),
        pricePerKgOrUnit: z.number().optional(),
        minOrderQuantity: z.number().optional(),
        packageSize: z.number().optional(),
        brand: z.string().optional(),
        notes: z.string().optional(),
        isFood: z.boolean().optional(),
        allergens: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.supplierId !== undefined) updateData.supplierId = input.supplierId;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.unitType !== undefined) updateData.unitType = input.unitType;
      if (input.packageQuantity !== undefined) updateData.packageQuantity = input.packageQuantity.toString();
      if (input.packagePrice !== undefined) updateData.packagePrice = input.packagePrice.toString();
      if (input.pricePerKgOrUnit !== undefined) updateData.pricePerKgOrUnit = input.pricePerKgOrUnit.toString();
      if (input.minOrderQuantity !== undefined) updateData.minOrderQuantity = input.minOrderQuantity.toString();
      if (input.packageSize !== undefined) updateData.packageSize = input.packageSize.toString();
      if (input.brand !== undefined) updateData.brand = input.brand;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.isFood !== undefined) updateData.isFood = input.isFood;
      if (input.allergens !== undefined) updateData.allergens = input.allergens;
      return db.updateIngredient(input.id, updateData);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.deleteIngredient(input.id);
    }),
  exportToExcel: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
      throw new Error("Unauthorized");
    }
    const ingredients = await db.getIngredients();
    
    // Crea file Excel con openpyxl via Python
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    
    const tempFile = path.join('/tmp', `ingredienti_${Date.now()}.xlsx`);
    const dataJson = JSON.stringify(ingredients);
    
    // Script Python per creare Excel
    const pythonScript = `
import json
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

data = json.loads('''${dataJson.replace(/'/g, "\\'").replace(/\\/g, '\\\\')}''')

wb = Workbook()
ws = wb.active
ws.title = "Ingredienti"

# Header
headers = ["ID", "Nome", "Categoria", "Fornitore", "Unit\u00e0", "Qt\u00e0 Confezione", 
           "Prezzo Confezione (\u20ac)", "Prezzo/kg o unit\u00e0 (\u20ac)", "Marca", "Note", "Food", "Allergeni"]
ws.append(headers)

# Stile header
header_fill = PatternFill(start_color="10B981", end_color="10B981", fill_type="solid")
header_font = Font(bold=True, color="FFFFFF")
for cell in ws[1]:
    cell.fill = header_fill
    cell.font = header_font
    cell.alignment = Alignment(horizontal="center")

# Dati
for ing in data:
    allergens_str = ", ".join(ing.get("allergens", [])) if ing.get("allergens") else ""
    ws.append([
        ing.get("id", ""),
        ing.get("name", ""),
        ing.get("category", ""),
        ing.get("supplierName", ""),
        "kg" if ing.get("unitType") == "k" else "pz",
        float(ing.get("packageQuantity", 0)),
        float(ing.get("packagePrice", 0)),
        float(ing.get("pricePerKgOrUnit", 0)),
        ing.get("brand", ""),
        ing.get("notes", ""),
        "S\u00ec" if ing.get("isFood") else "No",
        allergens_str
    ])

# Auto-size colonne
for column in ws.columns:
    max_length = 0
    column_letter = column[0].column_letter
    for cell in column:
        try:
            if len(str(cell.value)) > max_length:
                max_length = len(str(cell.value))
        except:
            pass
    adjusted_width = min(max_length + 2, 50)
    ws.column_dimensions[column_letter].width = adjusted_width

wb.save("${tempFile}")
print("OK")
`;
    
    try {
      execSync(`python3 -c '${pythonScript.replace(/'/g, "'\\''")}' 2>&1`, { encoding: 'utf-8' });
      
      if (!fs.existsSync(tempFile)) {
        throw new Error("File Excel non creato");
      }
      
      const fileBuffer = fs.readFileSync(tempFile);
      const base64 = fileBuffer.toString('base64');
      
      // Pulisci file temporaneo
      fs.unlinkSync(tempFile);
      
      return {
        filename: `ingredienti_${new Date().toISOString().split('T')[0]}.xlsx`,
        data: base64,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    } catch (error: any) {
      console.error('Errore export Excel:', error);
      throw new Error(`Errore durante export Excel: ${error.message}`);
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
      
      const { execSync } = require('child_process');
      const fs = require('fs');
      const path = require('path');
      
      const tempFile = path.join('/tmp', `import_${Date.now()}.xlsx`);
      const buffer = Buffer.from(input.fileData, 'base64');
      fs.writeFileSync(tempFile, buffer);
      
      // Script Python per leggere Excel
      const pythonScript = `
import json
from openpyxl import load_workbook

wb = load_workbook("${tempFile}")
ws = wb.active

result = []
headers = [cell.value for cell in ws[1]]

for row in ws.iter_rows(min_row=2, values_only=True):
    if not row[0]:  # Skip righe vuote
        continue
    item = {}
    for i, header in enumerate(headers):
        if i < len(row):
            item[header] = row[i]
    result.append(item)

print(json.dumps(result, ensure_ascii=False))
`;
      
      try {
        const output = execSync(`python3 -c '${pythonScript.replace(/'/g, "'\\''")}' 2>&1`, { encoding: 'utf-8' });
        const parsedData = JSON.parse(output);
        
        // Pulisci file temporaneo
        fs.unlinkSync(tempFile);
        
        // Valida e importa dati
        let imported = 0;
        let errors: string[] = [];
        
        for (const row of parsedData) {
          try {
            const ingredientId = row['ID'];
            if (!ingredientId) {
              errors.push(`Riga senza ID: ${JSON.stringify(row)}`);
              continue;
            }
            
            const updateData: any = {};
            if (row['Nome']) updateData.name = row['Nome'];
            if (row['Categoria']) updateData.category = row['Categoria'];
            if (row['Qtà Confezione']) updateData.packageQuantity = row['Qtà Confezione'].toString();
            if (row['Prezzo Confezione (€)']) updateData.packagePrice = row['Prezzo Confezione (€)'].toString();
            if (row['Prezzo/kg o unità (€)']) updateData.pricePerKgOrUnit = row['Prezzo/kg o unità (€)'].toString();
            if (row['Marca']) updateData.brand = row['Marca'];
            if (row['Note']) updateData.notes = row['Note'];
            if (row['Food']) updateData.isFood = row['Food'] === 'Sì' || row['Food'] === 'S\u00ec' || row['Food'] === true;
            
            await db.updateIngredient(ingredientId, updateData);
            imported++;
          } catch (err: any) {
            errors.push(`Errore riga ${row['Nome']}: ${err.message}`);
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
});

// ============ PROCEDURE SEMILAVORATI ============
const semiFinishedRouter = router({
  list: protectedProcedure.query(async () => {
    return db.getSemiFinishedRecipes();
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
    .query(async ({ input }) => {
      return db.getFoodMatrixItems(input);
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
    .query(async ({ input }) => {
      return db.getWeeklyProductions(input?.weekStartDate);
    }),

  listWeekly: protectedProcedure
    .input(z.object({ weekStartDate: z.date().optional() }).optional())
    .query(async ({ input }) => {
      return db.getWeeklyProductions(input?.weekStartDate);
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
      return db.createWeeklyProduction({
        id: crypto.randomUUID(),
        recipeFinalId: input.recipeFinalId || null,
        semiFinishedId: input.semiFinishedId || null,
        productionType: input.productionType,
        quantity: input.quantity,
        weekStartDate: input.weekStartDate,
      } as any);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.deleteWeeklyProduction(input.id);
    }),

  generateShoppingList: protectedProcedure
    .input(z.object({ weekStartDate: z.date().optional() }).optional())
    .query(async ({ input }) => {
      const weekStartDate = input?.weekStartDate;
      const productions = await db.getWeeklyProductions(weekStartDate);

      console.log('[generateShoppingList] Productions:', productions.length);

      // Carica TUTTI gli ingredienti e semilavorati
      const allIngredients = await db.getIngredients();
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
          supplier: ing.supplierName || 'N/A',
          quantityNeeded,
          quantityToOrder: 0,
          unitType: ing.unitType || 'k',
          pricePerUnit: parseFloat(ing.pricePerKgOrUnit),
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
  listTypes: protectedProcedure.query(async () => {
    return db.getMenuTypes();
  }),
  listItems: protectedProcedure
    .input(z.object({ menuTypeId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return db.getMenuItems(input?.menuTypeId);
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
  list: protectedProcedure.query(async () => {
    // Restituisce TUTTE le ricette (anche nascoste) per gestione nella pagina
    return db.getAllFinalRecipes();
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
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
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
      return db.createFinalRecipe({
        id: newId,
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
        productionOperations: null,
        serviceWastePerIngredient: null,
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
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
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
              pricePerUnit: operation?.costPerHour || 0,
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

  rollbackToVersion: protectedProcedure
    .input(z.object({ 
      recipeId: z.string(),
      versionId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }

      // Recupera la versione richiesta
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

  toggleActive: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      isActive: z.boolean()
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
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
    .query(async ({ input }) => {
      return db.getWasteRecords(input);
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
  listBatches: protectedProcedure.query(async () => {
    return db.getProductionBatches();
  }),
  listRecords: protectedProcedure.query(async () => {
    return db.getHACCPRecords();
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
    .query(async ({ input }) => {
      return db.getCloudStorageFiles(input);
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
  list: protectedProcedure.query(async () => {
    return db.getSuppliers();
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
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      return db.createSupplier(input as any);
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
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
        throw new Error("Unauthorized");
      }
      const { id, ...updateData } = input;
      return db.updateSupplier(id, updateData);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "manager") {
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
    .query(async ({ input }) => {
      return db.getOrders(input);
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

export const appRouter = router({
  auth: authRouter,
  ingredients: ingredientsRouter,
  semiFinished: semiFinishedRouter,
  finalRecipes: finalRecipesRouter,
  foodMatrix: foodMatrixRouter,
  operations: operationsRouter,
  production: productionRouter,
  menu: menuRouter,
  waste: wasteRouter,
  haccp: haccpRouter,
  storage: storageRouter,
  suppliers: suppliersRouter,
  orders: ordersRouter,
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
