import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  listSupportUsers: vi.fn(async () => [{ id: 1, name: "管理者", email: "admin@example.com", role: "admin", active: 1, createdAt: new Date(), lastSignedIn: new Date() }]),
  updateSupportUser: vi.fn(async (input: { targetUserId: number; actorUserId: number; role?: string; active?: boolean }) => ({ id: input.targetUserId, role: input.role ?? "user", active: input.active === false ? 0 : 1 })),
}));

vi.mock("./accountDb", () => mocks);
const { appRouter } = await import("./routers");

function makeContext(role: "user" | "admin"): TrpcContext {
  return {
    user: { id: role === "admin" ? 1 : 2, openId: `${role}-account`, name: role, email: `${role}@example.com`, loginMethod: "test", role, active: 1, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("account management tRPC API contract", () => {
  it("allows admins to list and update user access", async () => {
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.support.userList()).resolves.toHaveLength(1);
    await expect(caller.support.updateUser({ targetUserId: 7, role: "admin", active: true })).resolves.toMatchObject({ id: 7, role: "admin", active: 1 });
    expect(mocks.updateSupportUser).toHaveBeenCalledWith({ targetUserId: 7, role: "admin", active: true, actorUserId: 1 });
  });

  it("rejects non-admin access to account management", async () => {
    const caller = appRouter.createCaller(makeContext("user"));
    await expect(caller.support.userList()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.support.updateUser({ targetUserId: 7, active: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("surfaces account service failures", async () => {
    mocks.updateSupportUser.mockRejectedValueOnce(new Error("USER_NOT_FOUND"));
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.support.updateUser({ targetUserId: 999, active: false })).rejects.toThrow("USER_NOT_FOUND");
  });
});
