import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  getAllFridges,
  getFridgeById,
  createFridge,
  updateFridge,
  deleteFridge,
  addTemperatureLog,
  getTemperatureLogsByFridge,
  getOutOfRangeTemperatures,
} from "./haccpDb";

export const fridgesRouter = router({
  // Ottiene tutti i frighi attivi
  getAll: protectedProcedure.query(async () => {
    return await getAllFridges();
  }),

  // Ottiene un frigo per ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await getFridgeById(input.id);
    }),

  // Crea nuovo frigo
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["fridge", "freezer"]),
        location: z.enum(["kitchen", "sala"]),
        category: z.string().optional(),
        minTemp: z.string(),
        maxTemp: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await createFridge(input);
      return { id };
    }),

  // Aggiorna frigo
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        type: z.enum(["fridge", "freezer"]).optional(),
        location: z.enum(["kitchen", "sala"]).optional(),
        category: z.string().optional(),
        minTemp: z.string().optional(),
        maxTemp: z.string().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateFridge(id, data);
      return { success: true };
    }),

  // Elimina frigo (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await deleteFridge(input.id);
      return { success: true };
    }),

  // Aggiunge rilevazione temperatura
  addTemperature: protectedProcedure
    .input(
      z.object({
        fridgeId: z.string(),
        date: z.date(),
        temperature: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await addTemperatureLog({
        ...input,
        userId: ctx.user.id,
      });
      return { id };
    }),

  // Ottiene storico temperature per un frigo
  getTemperatures: protectedProcedure
    .input(
      z.object({
        fridgeId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getTemperatureLogsByFridge(
        input.fridgeId,
        input.startDate,
        input.endDate
      );
    }),

  // Ottiene temperature fuori range ultime 24h
  getOutOfRange: protectedProcedure.query(async () => {
    return await getOutOfRangeTemperatures();
  }),
});
