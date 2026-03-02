import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as storesDb from "./storesDb";

export const storesRouter = router({
  /**
   * Recuperare tutti gli store accessibili dall'utente corrente.
   * I superadmin vedono tutti gli store attivi.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "superadmin") {
      const all = await storesDb.getAllStores();
      return all.map((s) => ({
        storeId: s.id,
        role: "admin" as const,
        storeName: s.name,
        storeAddress: s.address,
        storePhone: s.phone,
        storeEmail: s.email,
        storeIsActive: s.isActive,
        storeIsGlobal: s.isGlobal,
        storeCreatedAt: s.createdAt,
      }));
    }
    return await storesDb.getUserStores(ctx.user.id);
  }),

  /**
   * Recuperare dettagli di uno store specifico
   */
  getById: protectedProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      
      // Verificare accesso
      const hasAccess = await storesDb.userHasAccessToStore(userId, input.storeId);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Non hai accesso a questo store",
        });
      }

      return await storesDb.getStoreById(input.storeId);
    }),

  /**
   * Creare un nuovo store (solo admin)
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        settings: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Solo admin e superadmin possono creare nuovi store
      if (ctx.user.role !== "admin" && ctx.user.role !== "superadmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli admin possono creare nuovi store",
        });
      }

      const storeId = crypto.randomUUID();
      const store = await storesDb.createStore({
        id: storeId,
        ...input,
      });

      // Associare l'utente creatore come admin dello store
      await storesDb.addUserToStore(ctx.user.id, storeId, "admin");

      return store;
    }),

  /**
   * Aggiornare uno store
   */
  update: protectedProcedure
    .input(
      z.object({
        storeId: z.string(),
        name: z.string().min(1).optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        settings: z.any().optional(),
        isActive: z.boolean().optional(),
        isGlobal: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { storeId, ...updateData } = input;

      // Superadmin possono modificare qualsiasi store; altrimenti deve essere admin dello store
      if (ctx.user.role !== "superadmin") {
        const role = await storesDb.getUserStoreRole(userId, storeId);
        if (role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Solo gli admin dello store possono modificarlo",
          });
        }
      }

      // Solo superadmin possono impostare isGlobal
      if (updateData.isGlobal !== undefined && ctx.user.role !== "superadmin" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo i superadmin possono impostare uno store come globale",
        });
      }

      await storesDb.updateStore(storeId, updateData);
      return { success: true };
    }),

  /**
   * Impostare lo store preferito dell'utente
   */
  setPreferred: protectedProcedure
    .input(z.object({ storeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verificare accesso allo store
      const hasAccess = await storesDb.userHasAccessToStore(userId, input.storeId);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Non hai accesso a questo store",
        });
      }

      await storesDb.setUserPreferredStore(userId, input.storeId);
      return { success: true, storeId: input.storeId };
    }),

  /**
   * Recuperare lo store preferito dell'utente
   */
  getPreferred: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const preferredStoreId = await storesDb.getUserPreferredStore(userId);

    if (!preferredStoreId) {
      // Se non ha preferenza, restituire il primo store accessibile
      const userStores = await storesDb.getUserStores(userId);
      if (userStores.length > 0) {
        return { storeId: userStores[0].storeId };
      }
      return null;
    }

    return { storeId: preferredStoreId };
  }),

  /**
   * Recuperare utenti di uno store (solo admin dello store)
   */
  getUsers: protectedProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verificare che l'utente sia admin dello store
      const role = await storesDb.getUserStoreRole(userId, input.storeId);
      if (role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli admin dello store possono vedere gli utenti",
        });
      }

      return await storesDb.getStoreUsers(input.storeId);
    }),

  /**
   * Aggiungere un utente a uno store (solo admin dello store)
   */
  addUser: protectedProcedure
    .input(
      z.object({
        storeId: z.string(),
        userId: z.number(),
        role: z.enum(["admin", "manager", "user"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.user.id;

      // Verificare che l'utente corrente sia admin dello store
      const currentUserRole = await storesDb.getUserStoreRole(currentUserId, input.storeId);
      if (currentUserRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli admin dello store possono aggiungere utenti",
        });
      }

      await storesDb.addUserToStore(input.userId, input.storeId, input.role);
      return { success: true };
    }),

  /**
   * Rimuovere un utente da uno store (solo admin dello store)
   */
  removeUser: protectedProcedure
    .input(
      z.object({
        storeId: z.string(),
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.user.id;

      // Verificare che l'utente corrente sia admin dello store
      const currentUserRole = await storesDb.getUserStoreRole(currentUserId, input.storeId);
      if (currentUserRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli admin dello store possono rimuovere utenti",
        });
      }

      // Non permettere di rimuovere se stesso
      if (input.userId === currentUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Non puoi rimuovere te stesso dallo store",
        });
      }

      await storesDb.removeUserFromStore(input.userId, input.storeId);
      return { success: true };
    }),

  /**
   * Aggiornare il ruolo di un utente in uno store (solo admin dello store)
   */
  updateUserRole: protectedProcedure
    .input(
      z.object({
        storeId: z.string(),
        userId: z.number(),
        role: z.enum(["admin", "manager", "user"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.user.id;

      // Verificare che l'utente corrente sia admin dello store
      const currentUserRole = await storesDb.getUserStoreRole(currentUserId, input.storeId);
      if (currentUserRole !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo gli admin dello store possono modificare i ruoli",
        });
      }

      await storesDb.updateUserStoreRole(input.userId, input.storeId, input.role);
      return { success: true };
    }),
});
