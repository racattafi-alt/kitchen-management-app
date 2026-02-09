import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  getUserOrderSession,
  upsertOrderSessionItem,
  clearUserOrderSession,
  saveOrderToHistory,
  getUserOrderHistory,
  getAllOrderHistory,
} from "./orderSessionsDb";
import { TRPCError } from "@trpc/server";

export const orderSessionsRouter = router({
  // Ottiene il carrello dell'utente corrente
  getMyCart: protectedProcedure.query(async ({ ctx }) => {
    const items = await getUserOrderSession(ctx.user.id);
    return items;
  }),

  // Aggiorna quantità di un item nel carrello
  updateItem: protectedProcedure
    .input(
      z.object({
        ingredientId: z.string(),
        quantity: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertOrderSessionItem(ctx.user.id, input.ingredientId, input.quantity);
      return { success: true };
    }),

  // Svuota il carrello
  clearCart: protectedProcedure.mutation(async ({ ctx }) => {
    await clearUserOrderSession(ctx.user.id);
    return { success: true };
  }),

  // Invia ordine (genera PDF, salva storico, svuota carrello)
  submitOrder: protectedProcedure
    .input(
      z.object({
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Ottieni items carrello
      const cartItems = await getUserOrderSession(ctx.user.id);

      if (cartItems.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Il carrello è vuoto",
        });
      }

      // Prepara dati ordine
      const orderData = {
        items: cartItems.map((item) => ({
          ingredientId: item.ingredientId,
          name: item.ingredientName,
          quantity: item.quantity,
          unit: item.unitType,
          category: item.category,
          supplier: item.supplier,
        })),
        date: new Date(),
      };

      // Salva nello storico (PDF sarà generato dal frontend)
      const orderId = await saveOrderToHistory(
        ctx.user.id,
        ctx.user.name as string,
        orderData,
        null, // PDF URL sarà aggiunto successivamente se necessario
        input.notes || null
      );

      // Svuota carrello
      await clearUserOrderSession(ctx.user.id);

      return {
        success: true,
        orderId,
        orderData,
      };
    }),

  // Ottiene storico ordini dell'utente
  getMyHistory: protectedProcedure.query(async ({ ctx }) => {
    const history = await getUserOrderHistory(ctx.user.id);
    return history;
  }),

  // Ottiene tutti gli ordini (solo admin)
  getAllHistory: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Solo gli amministratori possono vedere tutti gli ordini",
      });
    }

    const history = await getAllOrderHistory();
    return history;
  }),
});
