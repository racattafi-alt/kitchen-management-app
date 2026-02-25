import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  getUserOrderSession,
  upsertOrderSessionItem,
  clearUserOrderSession,
  saveOrderToHistory,
  getUserOrderHistory,
  getAllOrderHistory,
  getShoppingListSession,
  saveShoppingListSession,
  clearShoppingListSession,
} from "./orderSessionsDb";
import { TRPCError } from "@trpc/server";
import { logAction, AuditActions, EntityTypes } from "./auditLogHelper";

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
      if (!ctx.currentStoreId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nessuno store selezionato",
        });
      }
      
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
        input.notes || null,
        ctx.currentStoreId
      );

      // Svuota carrello
      await clearUserOrderSession(ctx.user.id);

      // Log audit
      await logAction({
        storeId: ctx.currentStoreId,
        userId: ctx.user.openId,
        action: AuditActions.ORDER_SUBMITTED,
        entityType: EntityTypes.ORDER,
        entityId: orderId,
        details: {
          itemCount: cartItems.length,
          notes: input.notes,
        },
      });

      return {
        success: true,
        orderId,
        orderData,
      };
    }),

  // Salva ordine dalla lista acquisti (senza svuotare carrello)
  saveShoppingListOrder: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            ingredientId: z.string(),
            name: z.string(),
            quantity: z.number(),
            unit: z.string(),
            category: z.string().optional(),
            supplier: z.string().optional(),
          })
        ),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.currentStoreId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nessuno store selezionato",
        });
      }
      
      if (input.items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nessun articolo da ordinare",
        });
      }

      // Prepara dati ordine
      const orderData = {
        items: input.items,
        date: new Date(),
      };

      // Salva nello storico
      const orderId = await saveOrderToHistory(
        ctx.user.id,
        ctx.user.name as string,
        orderData,
        null,
        input.notes || null,
        ctx.currentStoreId
      );

      return {
        success: true,
        orderId,
        orderData,
      };
    }),

  // Ottiene storico ordini dell'utente
  getMyHistory: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.currentStoreId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nessuno store selezionato",
      });
    }
    const history = await getUserOrderHistory(ctx.user.id, ctx.currentStoreId);
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

    if (!ctx.currentStoreId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nessuno store selezionato",
      });
    }
    const history = await getAllOrderHistory(ctx.currentStoreId);
    return history;
  }),

  // ============ NUOVE PROCEDURE PER PERSISTENZA SHOPPING LIST ============

  // Ottiene la sessione shopping list dell'utente
  getShoppingListSession: protectedProcedure.query(async ({ ctx }) => {
    const session = await getShoppingListSession(ctx.user.id);
    return session;
  }),

  // Salva la sessione shopping list (quantità e packages)
  saveShoppingListSession: protectedProcedure
    .input(
      z.object({
        orderQuantities: z.record(z.string(), z.number()),
        orderPackages: z.record(z.string(), z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await saveShoppingListSession(
        ctx.user.id,
        input.orderQuantities,
        input.orderPackages
      );
      return { success: true };
    }),

  // Cancella la sessione shopping list
  clearShoppingListSession: protectedProcedure.mutation(async ({ ctx }) => {
    await clearShoppingListSession(ctx.user.id);
    return { success: true };
  }),
});
