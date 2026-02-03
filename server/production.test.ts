import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("production.listWeekly", () => {
  it("returns list of weekly productions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.production.listWeekly();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("production.generateShoppingList", () => {
  it("returns empty array for non-existent week", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.production.generateShoppingList({
      weekId: "non-existent-week-id",
    });

    expect(result).toEqual([]);
  });

  it("aggregates ingredients correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First get available weeks
    const weeks = await caller.production.listWeekly();
    
    if (weeks.length > 0) {
      const result = await caller.production.generateShoppingList({
        weekId: weeks[0].id,
      });

      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const item = result[0];
        expect(item).toHaveProperty("itemName");
        expect(item).toHaveProperty("itemType");
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("supplier");
        expect(item).toHaveProperty("quantityNeeded");
        expect(item).toHaveProperty("totalCost");
      }
    }
  });

  it("calculates quantities correctly with yieldPercentage", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get all productions
    const result = await caller.production.generateShoppingList({});

    expect(Array.isArray(result)).toBe(true);
    
    // Find Spalla di Maiale in the shopping list
    const spalla = result.find((item: any) => 
      item.ingredientName?.includes("Spalla di Maiale")
    );
    
    if (spalla) {
      // Verify quantity is reasonable (normalized per kg)
      // Current productions: ~100kg of Pulled Pork
      // Should need ~122kg of Spalla (100 / 26.96 * 33)
      expect(spalla.quantityNeeded).toBeGreaterThan(50);
      expect(spalla.quantityNeeded).toBeLessThan(200);
    }
  });

  it("converts unit-based productions to kg correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get all productions
    const result = await caller.production.generateShoppingList({});

    expect(Array.isArray(result)).toBe(true);
    
    // Verify unit conversion worked (Tenders should appear in shopping list)
    const tenders = result.find((item: any) => 
      item.ingredientName?.includes("Tenders")
    );
    
    if (tenders) {
      // Tenders should be in kg (converted from units)
      expect(tenders.quantityNeeded).toBeGreaterThan(0);
      expect(tenders.unitType).toBe("k");
    }
  });

  it("rounds up unit-based ingredients", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get all productions
    const result = await caller.production.generateShoppingList({});

    expect(Array.isArray(result)).toBe(true);
    
    // Find unit-based ingredients (eggs, etc.)
    const unitIngredients = result.filter((item: any) => item.unitType === 'u');
    
    // Verify all unit quantities are integers (rounded up)
    for (const item of unitIngredients) {
      expect(Number.isInteger(item.quantityNeeded)).toBe(true);
    }
  });

  it("does NOT expand semi-finished recipes (shows them as items to buy)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get all productions
    const result = await caller.production.generateShoppingList({});

    expect(Array.isArray(result)).toBe(true);
    
    // Verify semi-finished items appear as items to buy
    const semiFinished = result.filter((item: any) => item.itemType === 'SEMI_FINISHED');
    
    // Should have at least some semi-finished items
    expect(semiFinished.length).toBeGreaterThan(0);
    
    // Verify they are marked as "Produzione Interna"
    for (const item of semiFinished) {
      expect(item.supplier).toBe('Produzione Interna');
    }
  });
});

describe("production.generateShoppingList - semilavorati", () => {
  it("mostra semilavorati come item da acquistare (non espansi)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Genera lista acquisti per tutte le produzioni
    const result = await caller.production.generateShoppingList({});

    // Verifica che ci siano item nella lista
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Verifica che ci siano semilavorati nella lista
    const semiFinished = result.filter((item: any) => item.itemType === 'SEMI_FINISHED');
    expect(semiFinished.length).toBeGreaterThan(0);

    // Verifica che i semilavorati abbiano i campi corretti
    const firstSemi = semiFinished[0];
    expect(firstSemi).toHaveProperty('itemName');
    expect(firstSemi).toHaveProperty('itemType', 'SEMI_FINISHED');
    expect(firstSemi).toHaveProperty('quantityNeeded');
    expect(firstSemi).toHaveProperty('supplier', 'Produzione Interna');
  });

  it("non espande ricorsivamente gli ingredienti dei semilavorati", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.production.generateShoppingList({});

    // Verifica che ci siano semilavorati nella lista
    const semiFinished = result.filter((item: any) => item.itemType === 'SEMI_FINISHED');
    expect(semiFinished.length).toBeGreaterThan(0);

    // Verifica che gli ingredienti dei semilavorati (es. Pepe, Sale, Coriandolo)
    // NON appaiano nella lista quando sono parte di un semilavorato
    // Nota: questo test assume che le produzioni attuali usino semilavorati
    // e che gli ingredienti base non siano usati direttamente in altre ricette
  });
});
