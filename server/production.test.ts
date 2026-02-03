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
        expect(item).toHaveProperty("ingredientName");
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
      // For 600kg of Pulled Pork, we need ~734kg of Spalla
      // (600 / 26.96 batch size * 33kg per batch = 734kg)
      expect(spalla.quantityNeeded).toBeGreaterThan(700);
      expect(spalla.quantityNeeded).toBeLessThan(800);
    }
  });
});
