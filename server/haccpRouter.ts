import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  getAllHaccpSheets,
  getCurrentWeekHaccpSheet,
  createHaccpWeeklySheet,
  updateHaccpWeeklySheet,
  getProductionChecksBySheet,
  createProductionCheck,
  updateProductionCheck,
  deleteProductionCheck,
} from "./haccpDb";

export const haccpRouter = router({
  // Ottiene scheda HACCP settimana corrente
  getCurrentWeek: protectedProcedure.query(async () => {
    return await getCurrentWeekHaccpSheet();
  }),

  // Ottiene tutte le schede HACCP (ultime 10)
  getAll: protectedProcedure.query(async () => {
    return await getAllHaccpSheets();
  }),

  // Crea nuova scheda HACCP settimanale
  createSheet: protectedProcedure
    .input(
      z.object({
        weekStartDate: z.date(),
        weekEndDate: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createHaccpWeeklySheet(input);
      return { id };
    }),

  // Aggiorna scheda HACCP
  updateSheet: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["draft", "completed", "approved"]).optional(),
        completedBy: z.number().optional(),
        completedAt: z.date().optional(),
        approvedBy: z.number().optional(),
        approvedAt: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateHaccpWeeklySheet(id, data);
      return { success: true };
    }),

  // Ottiene controlli produzione per una scheda
  getProductionChecks: protectedProcedure
    .input(z.object({ sheetId: z.string() }))
    .query(async ({ input }) => {
      return await getProductionChecksBySheet(input.sheetId);
    }),

  // Crea controllo produzione
  createProductionCheck: protectedProcedure
    .input(
      z.object({
        haccpSheetId: z.string(),
        productionId: z.string(),
        recipeName: z.string(),
        quantityProduced: z.string(),
        chillTemp4C: z.boolean().optional(),
        chillTempMinus20C: z.boolean().optional(),
        cookingTempOk: z.boolean().optional(),
        isCompliant: z.boolean().optional(),
        nonComplianceReason: z.string().optional(),
        correctiveAction: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createProductionCheck({
        ...input,
        checkedBy: ctx.user.id,
        checkedAt: new Date(),
      });
      return { id };
    }),

  // Aggiorna controllo produzione
  updateProductionCheck: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        chillTemp4C: z.boolean().optional(),
        chillTempMinus20C: z.boolean().optional(),
        cookingTempOk: z.boolean().optional(),
        isCompliant: z.boolean().optional(),
        nonComplianceReason: z.string().optional(),
        correctiveAction: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateProductionCheck(id, {
        ...data,
        checkedBy: ctx.user.id,
        checkedAt: new Date(),
      });
      return { success: true };
    }),

  // Elimina controllo produzione
  deleteProductionCheck: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await deleteProductionCheck(input.id);
      return { success: true };
    }),
});
