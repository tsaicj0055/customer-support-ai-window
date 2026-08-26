import { and, asc, eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";

const requireDb = async () => {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db;
};

export async function listSupportUsers() {
  const db = await requireDb();
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    active: users.active,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(asc(users.createdAt));
}

export async function updateSupportUser(input: { targetUserId: number; actorUserId: number; role?: "user" | "admin"; active?: boolean }) {
  const db = await requireDb();
  const target = (await db.select().from(users).where(eq(users.id, input.targetUserId)).limit(1))[0];
  if (!target) throw new Error("USER_NOT_FOUND");
  if (target.id === input.actorUserId && (input.active === false || input.role === "user")) {
    throw new Error("CANNOT_REVOKE_SELF");
  }
  const updates: { role?: "user" | "admin"; active?: number; updatedAt: Date } = { updatedAt: new Date() };
  if (input.role !== undefined) updates.role = input.role;
  if (input.active !== undefined) updates.active = input.active ? 1 : 0;
  await db.update(users).set(updates).where(eq(users.id, input.targetUserId));
  return (await listSupportUsers()).find((user) => user.id === input.targetUserId);
}

export async function countActiveAdmins() {
  const db = await requireDb();
  const rows = await db.select({ id: users.id }).from(users).where(and(eq(users.role, "admin"), eq(users.active, 1)));
  return rows.length;
}
