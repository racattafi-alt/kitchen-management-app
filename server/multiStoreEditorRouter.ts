import { router, protectedProcedure } from "./_core/trpc.js";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getIngredientAcrossStores,
  updateIngredientAcrossStores,
  getRecipeAcrossStores,
  updateRecipeAcrossStores,
  getSupplierAcrossStores,
  updateSupplierAcrossStores,
  listIngredientsGrouped,
  listRecipesGrouped,
  listSuppliersGrouped,
  getAllEntitiesFromStore,
} from "./multiStoreEditorDb.js";
import { logAction, AuditActions } from "./auditLogHelper.js";

export const multiStoreEditorRouter = router({
  // Lista entità aggregate per nome
  listEntities: protectedProcedure
    .input(z.object({
      entityType: z.enum(["ingredient", "recipe", "supplier"]),
    }))
    .query(async ({ input, ctx }) => {
      // Solo admin possono accedere all'editor multi-store
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli amministratori possono accedere all'editor multi-store",
        });
      }

      switch (input.entityType) {
        case "ingredient":
          return await listIngredientsGrouped();
        case "recipe":
          return await listRecipesGrouped();
        case "supplier":
          return await listSuppliersGrouped();
      }
    }),

  // Recupera entità da tutti gli store
  getEntityAcrossStores: protectedProcedure
    .input(z.object({
      entityType: z.enum(["ingredient", "recipe", "supplier"]),
      name: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli amministratori possono accedere all'editor multi-store",
        });
      }

      switch (input.entityType) {
        case "ingredient":
          return await getIngredientAcrossStores(input.name);
        case "recipe":
          return await getRecipeAcrossStores(input.name);
        case "supplier":
          return await getSupplierAcrossStores(input.name);
      }
    }),

  // Aggiorna entità in store specifici
  updateEntityAcrossStores: protectedProcedure
    .input(z.object({
      entityType: z.enum(["ingredient", "recipe", "supplier"]),
      name: z.string(),
      data: z.record(z.string(), z.any()),
      storeIds: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli amministratori possono modificare entità multi-store",
        });
      }

      let updates: Array<{ storeId: string; action: "created" | "updated"; id: string }> = [];
      
      switch (input.entityType) {
        case "ingredient":
          updates = await updateIngredientAcrossStores(
            input.name,
            input.data,
            input.storeIds
          );
          break;
        case "recipe":
          updates = await updateRecipeAcrossStores(
            input.name,
            input.data,
            input.storeIds
          );
          break;
        case "supplier":
          updates = await updateSupplierAcrossStores(
            input.name,
            input.data,
            input.storeIds
          );
          break;
      }

      // Log audit per ogni store aggiornato
      for (const update of updates) {
        await logAction({
          storeId: update.storeId,
          userId: String(ctx.user.id),
          action: `multistore.${input.entityType}.${update.action}`,
          entityType: input.entityType,
          entityId: update.id,
          details: {
            entityName: input.name,
            updatedFields: Object.keys(input.data),
            targetStores: input.storeIds,
          },
        });
      }

      return {
        success: true,
        updates,
        message: `${input.entityType} "${input.name}" aggiornato in ${updates.length} store`,
      };
    }),

  // Migrazione bulk: copia tutti i dati da uno store sorgente a store destinazione
  bulkMigrateFromStore: protectedProcedure
    .input(z.object({
      sourceStoreId: z.string(),
      destinationStoreIds: z.array(z.string()),
      entityTypes: z.array(z.enum(["ingredient", "recipe", "supplier"])),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli amministratori possono migrare dati tra store",
        });
      }

      if (input.destinationStoreIds.includes(input.sourceStoreId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Lo store sorgente non può essere anche destinazione",
        });
      }

      let totalMigrated = 0;
      const results: { entityType: string; name: string; storeId: string; action: string }[] = [];

      for (const entityType of input.entityTypes) {
        const entities = await getAllEntitiesFromStore(entityType, input.sourceStoreId);

        for (const entity of entities) {
          const { id, storeId, createdAt, updatedAt, ...data } = entity as any;

          let updates: Array<{ storeId: string; action: string; id: string }> = [];
          if (entityType === "ingredient") {
            updates = await updateIngredientAcrossStores(entity.name, data, input.destinationStoreIds);
          } else if (entityType === "recipe") {
            updates = await updateRecipeAcrossStores(entity.name, data, input.destinationStoreIds);
          } else {
            updates = await updateSupplierAcrossStores(entity.name, data, input.destinationStoreIds);
          }

          updates.forEach(u => results.push({ entityType, name: entity.name, ...u }));
          totalMigrated++;
        }
      }

      await logAction({
        storeId: input.sourceStoreId,
        userId: String(ctx.user.id),
        action: "multistore.bulk_migrate",
        entityType: "store",
        entityId: input.sourceStoreId,
        details: {
          destinationStoreIds: input.destinationStoreIds,
          entityTypes: input.entityTypes,
          totalMigrated,
        },
      });

      return { success: true, totalMigrated, results };
    }),
});
