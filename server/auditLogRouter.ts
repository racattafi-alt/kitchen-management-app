import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as auditLogDb from "./auditLogDb";

export const auditLogRouter = router({
  /**
   * Recuperare log audit per lo store corrente
   */
  listByStore: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.currentStoreId) {
        throw new Error("No store selected");
      }
      return auditLogDb.getAuditLogsByStore(
        ctx.currentStoreId,
        input?.limit || 100
      );
    }),

  /**
   * Recuperare log audit per un'entità specifica
   */
  listByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return auditLogDb.getAuditLogsByEntity(
        input.entityType,
        input.entityId,
        input.limit || 50
      );
    }),

  /**
   * Recuperare log audit per l'utente corrente
   */
  listMyLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return auditLogDb.getAuditLogsByUser(
        ctx.user!.openId,
        input?.limit || 100
      );
    }),

  /**
   * Recuperare tutti i log audit (solo admin)
   */
  listAll: protectedProcedure
    .input(
      z.object({
        storeId: z.string().optional(),
        userId: z.string().optional(),
        entityType: z.string().optional(),
        action: z.string().optional(),
        limit: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      // Solo admin possono vedere tutti i log
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Only admins can view all audit logs");
      }
      return auditLogDb.getAllAuditLogs(input);
    }),
});
