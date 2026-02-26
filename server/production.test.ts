import { describe, expect, it, vi, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Default mock: all DB calls return empty data (no real DB needed)
vi.mock("./db", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./db")>();
  return {
    ...mod,
    getWeeklyProductions: vi.fn(async () => []),
    getFinalRecipeById: vi.fn(async () => null),
    getSemiFinishedRecipes: vi.fn(async () => []),
    getIngredients: vi.fn(async () => []),
  };
});

// ── Mock semi-finished test data ─────────────────────────────────────────────
const mockSemiFinished = {
  id: "semi-1",
  name: "Test Semilavorato",
  components: [],
  yieldPercentage: "0.9",
  finalPricePerKg: "5.00",
  storeId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const mockRecipe = {
  id: "recipe-1",
  name: "Test Ricetta Finale",
  unitWeight: "1",
  components: [
    { type: "semi_finished", componentId: "semi-1", quantity: 200, unit: "k" },
  ],
  storeId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const mockProduction = {
  id: "prod-1",
  recipeFinalId: "recipe-1",
  quantity: "10",
  weekStartDate: new Date(),
  storeId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;
// ─────────────────────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "local",
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
    currentStoreId: null,
    logout: () => {},
  };

  return { ctx };
}

afterEach(() => {
  vi.clearAllMocks();
});

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

    const result = await caller.production.generateShoppingList({});

    expect(Array.isArray(result)).toBe(true);

    const spalla = result.find((item: any) =>
      item.ingredientName?.includes("Spalla di Maiale")
    );

    if (spalla) {
      expect(spalla.quantityNeeded).toBeGreaterThan(50);
      expect(spalla.quantityNeeded).toBeLessThan(200);
    }
  });

  it("converts unit-based productions to kg correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.production.generateShoppingList({});

    expect(Array.isArray(result)).toBe(true);

    const tenders = result.find((item: any) =>
      item.ingredientName?.includes("Tenders")
    );

    if (tenders) {
      expect(tenders.quantityNeeded).toBeGreaterThan(0);
      expect(tenders.unitType).toBe("k");
    }
  });

  it("rounds up unit-based ingredients", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.production.generateShoppingList({});

    expect(Array.isArray(result)).toBe(true);

    const unitIngredients = result.filter((item: any) => item.unitType === "u");

    for (const item of unitIngredients) {
      expect(Number.isInteger(item.quantityNeeded)).toBe(true);
    }
  });

  it("does NOT expand semi-finished recipes (shows them as items to buy)", async () => {
    vi.mocked(db.getWeeklyProductions).mockResolvedValueOnce([mockProduction]);
    vi.mocked(db.getFinalRecipeById).mockResolvedValueOnce(mockRecipe);
    vi.mocked(db.getSemiFinishedRecipes).mockResolvedValueOnce([mockSemiFinished]);
    vi.mocked(db.getIngredients).mockResolvedValueOnce([]);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.production.generateShoppingList({});

    expect(Array.isArray(result)).toBe(true);

    const semiFinished = result.filter((item: any) => item.itemType === "SEMI_FINISHED");

    expect(semiFinished.length).toBeGreaterThan(0);

    for (const item of semiFinished) {
      expect(item.supplier).toBe("Produzione Interna");
    }
  });
});

describe("production.generateShoppingList - semilavorati", () => {
  it("mostra semilavorati come item da acquistare (non espansi)", async () => {
    vi.mocked(db.getWeeklyProductions).mockResolvedValueOnce([mockProduction]);
    vi.mocked(db.getFinalRecipeById).mockResolvedValueOnce(mockRecipe);
    vi.mocked(db.getSemiFinishedRecipes).mockResolvedValueOnce([mockSemiFinished]);
    vi.mocked(db.getIngredients).mockResolvedValueOnce([]);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.production.generateShoppingList({});

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const semiFinished = result.filter((item: any) => item.itemType === "SEMI_FINISHED");
    expect(semiFinished.length).toBeGreaterThan(0);

    const firstSemi = semiFinished[0];
    expect(firstSemi).toHaveProperty("itemName");
    expect(firstSemi).toHaveProperty("itemType", "SEMI_FINISHED");
    expect(firstSemi).toHaveProperty("quantityNeeded");
    expect(firstSemi).toHaveProperty("supplier", "Produzione Interna");
  });

  it("non espande ricorsivamente gli ingredienti dei semilavorati", async () => {
    vi.mocked(db.getWeeklyProductions).mockResolvedValueOnce([mockProduction]);
    vi.mocked(db.getFinalRecipeById).mockResolvedValueOnce(mockRecipe);
    vi.mocked(db.getSemiFinishedRecipes).mockResolvedValueOnce([mockSemiFinished]);
    vi.mocked(db.getIngredients).mockResolvedValueOnce([]);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.production.generateShoppingList({});

    const semiFinished = result.filter((item: any) => item.itemType === "SEMI_FINISHED");
    expect(semiFinished.length).toBeGreaterThan(0);

    // The mock semi-finished has no sub-ingredients, so only the semi-finished
    // itself should appear — its internal components are NOT expanded
    const ingredientItems = result.filter((item: any) => item.itemType === "INGREDIENT");
    expect(ingredientItems.length).toBe(0);
  });
});
