import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./_core/trpc";
import * as storesDb from "./storesDb";

/**
 * Procedure con accesso store verificato
 * Aggiunge currentStoreId al context
 */
export const storeAwareProcedure = protectedProcedure.use(async (opts) => {
  const { ctx, next } = opts;

  // Usare store preferito dell'utente
  let storeId: string | null = null;

  // Se non specificato, usare store preferito dell'utente
  if (!storeId) {
    storeId = await storesDb.getUserPreferredStore(ctx.user.id);
  }

  // Se ancora null, prendere il primo store accessibile
  if (!storeId) {
    const userStores = await storesDb.getUserStores(ctx.user.id);
    if (userStores.length === 0) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Non hai accesso a nessuno store",
      });
    }
    storeId = userStores[0].storeId;
  }

  // Verificare che l'utente abbia accesso allo store
  const hasAccess = await storesDb.userHasAccessToStore(ctx.user.id, storeId);
  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Non hai accesso a questo store",
    });
  }

  // Aggiungere currentStoreId al context
  return next({
    ctx: {
      ...ctx,
      currentStoreId: storeId,
    },
  });
});
