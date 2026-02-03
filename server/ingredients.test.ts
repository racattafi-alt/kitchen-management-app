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

function createManagerContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "manager-user",
    email: "manager@example.com",
    name: "Manager User",
    loginMethod: "manus",
    role: "manager",
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

function createCookContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 3,
    openId: "cook-user",
    email: "cook@example.com",
    name: "Cook User",
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

describe("ingredients router", () => {
  it("admin can list ingredients", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.ingredients.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("manager can list ingredients", async () => {
    const ctx = createManagerContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.ingredients.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("cook can list ingredients", async () => {
    const ctx = createCookContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.ingredients.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("role-based access control", () => {
  it("cook cannot create ingredients", async () => {
    const ctx = createCookContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.ingredients.create({
        name: "Test Ingredient",
        supplier: "Test Supplier",
        category: "Altro",
        unitType: "k",
        packageQuantity: 1,
        packagePrice: 10,
      })
    ).rejects.toThrow("Unauthorized");
  });

  it("cook cannot delete ingredients", async () => {
    const ctx = createCookContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.ingredients.delete({ id: "test-id" })
    ).rejects.toThrow("Unauthorized");
  });
});
