import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): { ctx: TrpcContext; caller: any } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    role: "admin",
    createdAt: new Date(),
  };

  const ctx: TrpcContext = {
    req: {} as any,
    res: {} as any,
    user,
    logout: () => {},
  };

  const caller = appRouter.createCaller(ctx);

  return { ctx, caller };
}

describe("Shopping List Session Persistence", () => {
  let ctx: TrpcContext;
  let caller: any;
  let testUserId: number;

  beforeEach(async () => {
    const testContext = createTestContext();
    ctx = testContext.ctx;
    caller = testContext.caller;
    testUserId = ctx.user!.id;
  });

  afterEach(async () => {
    // Cleanup: cancella sessione test
    try {
      await caller.orderSessions.clearShoppingListSession();
    } catch (e) {
      // Ignora errori di cleanup
    }
  });

  it("should save shopping list session with quantities and packages", async () => {
    const orderQuantities = {
      "ing-1": 5.5,
      "ing-2": 10.0,
      "ing-3": 2.3,
    };

    const orderPackages = {
      "ing-1": 2,
      "ing-2": 5,
    };

    const result = await caller.orderSessions.saveShoppingListSession({
      orderQuantities,
      orderPackages,
    });

    expect(result.success).toBe(true);
  });

  it("should retrieve saved shopping list session", async () => {
    const orderQuantities = {
      "ing-test-1": 7.5,
      "ing-test-2": 12.0,
    };

    const orderPackages = {
      "ing-test-1": 3,
    };

    // Salva sessione
    await caller.orderSessions.saveShoppingListSession({
      orderQuantities,
      orderPackages,
    });

    // Recupera sessione
    const session = await caller.orderSessions.getShoppingListSession();

    expect(session).toBeDefined();
    expect(session.orderQuantities).toEqual(orderQuantities);
    expect(session.orderPackages).toEqual(orderPackages);
  });

  it("should update existing session when saving again", async () => {
    // Prima sessione
    await caller.orderSessions.saveShoppingListSession({
      orderQuantities: { "ing-1": 5.0 },
      orderPackages: { "ing-1": 2 },
    });

    // Aggiorna sessione
    const newQuantities = {
      "ing-1": 10.0,
      "ing-2": 3.5,
    };

    const newPackages = {
      "ing-1": 4,
      "ing-2": 1,
    };

    await caller.orderSessions.saveShoppingListSession({
      orderQuantities: newQuantities,
      orderPackages: newPackages,
    });

    // Verifica aggiornamento
    const session = await caller.orderSessions.getShoppingListSession();

    expect(session.orderQuantities).toEqual(newQuantities);
    expect(session.orderPackages).toEqual(newPackages);
  });

  it("should clear shopping list session", async () => {
    // Salva sessione
    await caller.orderSessions.saveShoppingListSession({
      orderQuantities: { "ing-1": 5.0 },
      orderPackages: { "ing-1": 2 },
    });

    // Cancella sessione
    const result = await caller.orderSessions.clearShoppingListSession();
    expect(result.success).toBe(true);

    // Verifica che sia stata cancellata
    const session = await caller.orderSessions.getShoppingListSession();
    expect(session).toBeNull();
  });

  it("should return null for non-existent session", async () => {
    const session = await caller.orderSessions.getShoppingListSession();
    expect(session).toBeNull();
  });

  it("should handle empty quantities and packages", async () => {
    const result = await caller.orderSessions.saveShoppingListSession({
      orderQuantities: {},
      orderPackages: {},
    });

    expect(result.success).toBe(true);

    const session = await caller.orderSessions.getShoppingListSession();
    expect(session.orderQuantities).toEqual({});
    expect(session.orderPackages).toEqual({});
  });

  it("should persist session across multiple queries", async () => {
    const orderQuantities = {
      "ing-persist-1": 15.5,
      "ing-persist-2": 8.0,
    };

    const orderPackages = {
      "ing-persist-1": 6,
    };

    // Salva
    await caller.orderSessions.saveShoppingListSession({
      orderQuantities,
      orderPackages,
    });

    // Recupera più volte
    const session1 = await caller.orderSessions.getShoppingListSession();
    const session2 = await caller.orderSessions.getShoppingListSession();
    const session3 = await caller.orderSessions.getShoppingListSession();

    expect(session1.orderQuantities).toEqual(orderQuantities);
    expect(session2.orderQuantities).toEqual(orderQuantities);
    expect(session3.orderQuantities).toEqual(orderQuantities);
  });
});
