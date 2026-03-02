import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "./db";
import {
  foodMatrixEntries,
  foodMatrixSnapshots,
  ingredients,
  semiFinishedRecipes,
  finalRecipes,
  FoodMatrixComponent,
} from "../drizzle/schema";
import * as db from "./db";

// ---- Zod schema per un singolo componente ----
const componentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("INGREDIENT"),
    sourceId: z.string(),
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
  }),
  z.object({
    type: z.literal("SEMI_FINISHED"),
    sourceId: z.string(),
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
  }),
  z.object({
    type: z.literal("FINAL_RECIPE"),
    sourceId: z.string(),
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
  }),
  z.object({
    type: z.literal("MANUAL"),
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
    pricePerUnit: z.number(),
  }),
]);

// ---- Calcola il costo per porzione dai componenti ----
async function computeCostPerServing(
  components: FoodMatrixComponent[],
  storeId: string
): Promise<number> {
  const database = await getDb();
  if (!database) return 0;

  let total = 0;
  for (const c of components) {
    if (c.type === "MANUAL") {
      total += c.pricePerUnit * c.quantity;
    } else if (c.type === "INGREDIENT") {
      const result = await database
        .select({ pricePerKgOrUnit: ingredients.pricePerKgOrUnit })
        .from(ingredients)
        .where(and(eq(ingredients.id, c.sourceId), eq(ingredients.storeId, storeId)))
        .limit(1);
      if (result.length > 0) {
        total += parseFloat(result[0].pricePerKgOrUnit) * c.quantity;
      }
    } else if (c.type === "SEMI_FINISHED") {
      const result = await database
        .select({ totalCost: semiFinishedRecipes.totalCost })
        .from(semiFinishedRecipes)
        .where(eq(semiFinishedRecipes.id, c.sourceId))
        .limit(1);
      if (result.length > 0) {
        total += parseFloat(result[0].totalCost) * c.quantity;
      }
    } else if (c.type === "FINAL_RECIPE") {
      const result = await database
        .select({ totalCost: finalRecipes.totalCost })
        .from(finalRecipes)
        .where(eq(finalRecipes.id, c.sourceId))
        .limit(1);
      if (result.length > 0) {
        total += parseFloat(result[0].totalCost) * c.quantity;
      }
    }
  }
  return total;
}

// ---- Sub-router entries ----
const entriesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];
    return database
      .select()
      .from(foodMatrixEntries)
      .where(
        and(
          eq(foodMatrixEntries.storeId, ctx.currentStoreId ?? ""),
          eq(foodMatrixEntries.isActive, true)
        )
      )
      .orderBy(foodMatrixEntries.name);
  }),

  upsert: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string(),
        category: z.string().default("Altro"),
        servingSize: z.number().default(1),
        servingUnit: z.string().default("porzione"),
        sellingPrice: z.number().nullable().optional(),
        components: z.array(componentSchema),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const role = ctx.user?.role;
      if (role !== "admin" && role !== "manager" && role !== "superadmin") {
        throw new Error("Unauthorized");
      }
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      const storeId = ctx.currentStoreId ?? "";
      const costPerServing = await computeCostPerServing(
        input.components as FoodMatrixComponent[],
        storeId
      );

      const entryId = input.id ?? uuidv4();

      if (input.id) {
        // Update existing
        await database
          .update(foodMatrixEntries)
          .set({
            name: input.name,
            category: input.category,
            servingSize: input.servingSize.toString(),
            servingUnit: input.servingUnit,
            sellingPrice: input.sellingPrice != null ? input.sellingPrice.toString() : null,
            components: input.components as FoodMatrixComponent[],
            costPerServing: costPerServing.toFixed(4),
          })
          .where(eq(foodMatrixEntries.id, input.id));
      } else {
        // Insert new
        await database.insert(foodMatrixEntries).values({
          id: entryId,
          storeId,
          name: input.name,
          category: input.category,
          servingSize: input.servingSize.toString(),
          servingUnit: input.servingUnit,
          sellingPrice: input.sellingPrice != null ? input.sellingPrice.toString() : null,
          components: input.components as FoodMatrixComponent[],
          costPerServing: costPerServing.toFixed(4),
          isActive: true,
        } as any);
      }
      return { id: entryId, costPerServing };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const role = ctx.user?.role;
      if (role !== "admin" && role !== "manager" && role !== "superadmin") {
        throw new Error("Unauthorized");
      }
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      await database
        .update(foodMatrixEntries)
        .set({ isActive: false })
        .where(
          and(
            eq(foodMatrixEntries.id, input.id),
            eq(foodMatrixEntries.storeId, ctx.currentStoreId ?? "")
          )
        );
      return { success: true };
    }),
});

// ---- Sub-router snapshots ----
const snapshotsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];
    return database
      .select()
      .from(foodMatrixSnapshots)
      .where(eq(foodMatrixSnapshots.storeId, ctx.currentStoreId ?? ""))
      .orderBy(desc(foodMatrixSnapshots.createdAt))
      .limit(50);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return null;
      const result = await database
        .select()
        .from(foodMatrixSnapshots)
        .where(eq(foodMatrixSnapshots.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),
});

// ---- Main foodMatrixV2 router ----
export const foodMatrixV2Router = router({
  entries: entriesRouter,
  snapshots: snapshotsRouter,

  updateSellingPrices: protectedProcedure
    .input(
      z.object({
        updates: z.array(z.object({ entryId: z.string(), sellingPrice: z.number() })),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const role = ctx.user?.role;
      if (role !== "admin" && role !== "manager" && role !== "superadmin") {
        throw new Error("Unauthorized");
      }
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      const storeId = ctx.currentStoreId ?? "";

      // Bulk update selling prices
      for (const upd of input.updates) {
        await database
          .update(foodMatrixEntries)
          .set({ sellingPrice: upd.sellingPrice.toString() })
          .where(
            and(
              eq(foodMatrixEntries.id, upd.entryId),
              eq(foodMatrixEntries.storeId, storeId)
            )
          );
      }

      // Collect current state for snapshot
      const allEntries = await database
        .select()
        .from(foodMatrixEntries)
        .where(and(eq(foodMatrixEntries.storeId, storeId), eq(foodMatrixEntries.isActive, true)));

      const snapshotData = allEntries.map((e) => {
        const cost = parseFloat(e.costPerServing ?? "0");
        const selling = parseFloat(e.sellingPrice ?? "0");
        const foodCostPct = selling > 0 ? (cost / selling) * 100 : null;
        return {
          id: e.id,
          name: e.name,
          category: e.category,
          servingSize: e.servingSize,
          servingUnit: e.servingUnit,
          costPerServing: cost,
          sellingPrice: selling,
          foodCostPct,
        };
      });

      await database.insert(foodMatrixSnapshots).values({
        id: uuidv4(),
        storeId,
        snapshotType: "PRICE_EDIT",
        description: input.description ?? "Aggiornamento prezzi vendita",
        data: snapshotData as any,
        createdBy: ctx.user?.openId ?? "unknown",
      } as any);

      return { success: true, updated: input.updates.length };
    }),

  createPriceUpdateSnapshot: protectedProcedure
    .input(
      z.object({
        description: z.string().optional(),
        ingredientUpdates: z.array(
          z.object({ name: z.string(), oldPrice: z.number(), newPrice: z.number() })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      const storeId = ctx.currentStoreId ?? "";

      // Collect current food matrix entries state
      const allEntries = await database
        .select()
        .from(foodMatrixEntries)
        .where(and(eq(foodMatrixEntries.storeId, storeId), eq(foodMatrixEntries.isActive, true)));

      const snapshotData = {
        ingredientUpdates: input.ingredientUpdates,
        entries: allEntries.map((e) => {
          const cost = parseFloat(e.costPerServing ?? "0");
          const selling = parseFloat(e.sellingPrice ?? "0");
          const foodCostPct = selling > 0 ? (cost / selling) * 100 : null;
          return {
            id: e.id,
            name: e.name,
            category: e.category,
            costPerServing: cost,
            sellingPrice: selling,
            foodCostPct,
          };
        }),
      };

      await database.insert(foodMatrixSnapshots).values({
        id: uuidv4(),
        storeId,
        snapshotType: "PRICE_UPDATE",
        description: input.description ?? "Aggiornamento prezzi ingredienti",
        data: snapshotData as any,
        createdBy: ctx.user?.openId ?? "unknown",
      } as any);

      return { success: true };
    }),
});
