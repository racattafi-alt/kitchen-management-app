import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./nonConformitiesDb";

export const nonConformitiesRouter = router({
  // Creare nuova non conformità
  create: protectedProcedure
    .input(
      z.object({
        productionCheckId: z.string().optional(),
        recipeName: z.string().optional(),
        weekStartDate: z.date().optional(),
        description: z.string().min(1),
        immediateAction: z.string().optional(),
        productTreatment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.createNonConformity({
        detectedByUserId: ctx.user.id,
        detectedByUserName: ctx.user.name || "Unknown",
        ...input,
      });
    }),

  // Aggiornare non conformità
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        description: z.string().optional(),
        immediateAction: z.string().optional(),
        productTreatment: z.string().optional(),
        rootCauseAnalysis: z.string().optional(),
        rootCauseCategory: z.string().optional(),
        correctiveActionPlan: z.string().optional(),
        correctiveActionDeadline: z.date().optional(),
        correctiveActionResponsible: z.string().optional(),
        effectivenessVerification: z.string().optional(),
        verificationDate: z.date().optional(),
        verificationEvidence: z.string().optional(),
        status: z.enum(["open", "in_progress", "pending_verification", "closed"]).optional(),
        qualityManagerSignature: z.string().optional(),
        directorSignature: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateNonConformity(id, data);
      return { success: true };
    }),

  // Ottenere singola non conformità
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.getNonConformityById(input.id);
    }),

  // Ottenere tutte le non conformità con filtri
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(["open", "in_progress", "pending_verification", "closed"]).optional(),
        year: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return await db.getAllNonConformities(input);
    }),

  // Ottenere non conformità per production check
  getByProductionCheck: protectedProcedure
    .input(z.object({ productionCheckId: z.string() }))
    .query(async ({ input }) => {
      return await db.getNonConformitiesByProductionCheck(input.productionCheckId);
    }),

  // Eliminare non conformità
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.deleteNonConformity(input.id);
      return { success: true };
    }),
});
