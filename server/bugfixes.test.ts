import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(userId: number = 2): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Bug Fix: Ingredient update includes supplier field", () => {
  it("update procedure accepts supplier field in input schema", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Verify the update procedure exists and accepts supplier field
    // We test the schema validation by checking that it doesn't throw on valid input
    // (actual DB update would require a real ingredient ID)
    try {
      await caller.ingredients.update({
        id: "nonexistent-id",
        supplier: "Test Supplier",
        supplierId: "test-supplier-id",
      });
    } catch (e: any) {
      // Expected: "Ingredient not found" means schema validation passed
      expect(e.message).toBe("Ingredient not found");
    }
  });

  it("update procedure accepts category 'Caffè' in enum", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.ingredients.update({
        id: "nonexistent-id",
        category: "Caffè",
      });
    } catch (e: any) {
      // "Ingredient not found" means Caffè passed Zod validation
      expect(e.message).toBe("Ingredient not found");
    }
  });

  it("update procedure accepts all category enum values", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const categories = [
      "Additivi", "Alcolici", "Bevande", "Birra", "Caffè",
      "Carni", "Farine", "Latticini", "Non Food", "Packaging",
      "Spezie", "Verdura", "Altro"
    ];

    for (const category of categories) {
      try {
        await caller.ingredients.update({
          id: "nonexistent-id",
          category: category as any,
        });
      } catch (e: any) {
        // "Ingredient not found" means category passed Zod validation
        expect(e.message).toBe("Ingredient not found");
      }
    }
  });
});

describe("Bug Fix: Order history visibility", () => {
  it("getAllHistory procedure exists and is accessible by admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Admin should be able to call getAllHistory
    const result = await caller.orderSessions.getAllHistory();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getMyHistory procedure exists and returns array", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderSessions.getMyHistory();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Bug Fix: Shopping list generation", () => {
  it("generateShoppingList returns items with category field", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.production.generateShoppingList();
    expect(Array.isArray(result)).toBe(true);

    // If there are items, verify they have the category field
    if (result.length > 0) {
      for (const item of result) {
        expect(item).toHaveProperty("category");
        // Category should be a non-empty string
        expect(typeof item.category).toBe("string");
        expect(item.category.length).toBeGreaterThan(0);
      }
    }
  });

  it("generateShoppingList returns items with supplier field", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.production.generateShoppingList();
    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      for (const item of result) {
        expect(item).toHaveProperty("supplier");
        expect(typeof item.supplier).toBe("string");
        // Supplier should not be "N/A" for items with a known supplier
      }
    }
  });

  it("generateShoppingList returns packageQuantity as number", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.production.generateShoppingList();
    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      for (const item of result) {
        if (item.packageQuantity !== null && item.packageQuantity !== undefined) {
          expect(typeof item.packageQuantity).toBe("number");
        }
      }
    }
  });
});
