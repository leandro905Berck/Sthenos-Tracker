import { Router, type IRouter } from "express";
import { desc, eq, and } from "drizzle-orm";
import { db, weightChecksTable } from "@workspace/db";
import { CreateWeightCheckBody } from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";

const router: IRouter = Router();

function serializeWeightCheck(w: typeof weightChecksTable.$inferSelect) {
  return {
    id: w.id,
    weightKg: Number(w.weightKg),
    date: w.date,
    notes: w.notes ?? null,
    createdAt: w.createdAt instanceof Date ? w.createdAt.toISOString() : String(w.createdAt),
  };
}

router.get("/weight-checks", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const checks = await db.select().from(weightChecksTable)
    .where(eq(weightChecksTable.userId, userId))
    .orderBy(desc(weightChecksTable.date));
  res.json(checks.map(serializeWeightCheck));
});

router.post("/weight-checks", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const parsed = CreateWeightCheckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [check] = await db.insert(weightChecksTable).values({ ...parsed.data, userId }).returning();
  res.status(201).json(serializeWeightCheck(check));
});

router.get("/weight-checks/pending", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const checks = await db.select().from(weightChecksTable)
    .where(eq(weightChecksTable.userId, userId))
    .orderBy(desc(weightChecksTable.createdAt))
    .limit(1);

  if (!checks[0]) {
    res.json({ isPending: true, lastCheckDate: null, daysSinceLastCheck: null });
    return;
  }

  const lastCheckDate = checks[0].date;
  const lastDate = new Date(lastCheckDate);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const daysSinceLastCheck = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isPending = daysSinceLastCheck >= 7;

  res.json({ isPending, lastCheckDate, daysSinceLastCheck });
});

router.patch("/weight-checks/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const body = req.body as { weightKg?: unknown; date?: unknown; notes?: unknown };
  const updateData: Record<string, unknown> = {};
  if (body.weightKg !== undefined) updateData.weightKg = String(Number(body.weightKg));
  if (body.date !== undefined) updateData.date = String(body.date);
  if (body.notes !== undefined) updateData.notes = body.notes === null ? null : String(body.notes);

  const [updated] = await db.update(weightChecksTable)
    .set(updateData)
    .where(and(eq(weightChecksTable.id, id), eq(weightChecksTable.userId, userId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Registro não encontrado" });
    return;
  }
  res.json(serializeWeightCheck(updated));
});

router.delete("/weight-checks/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [deleted] = await db.delete(weightChecksTable)
    .where(and(eq(weightChecksTable.id, id), eq(weightChecksTable.userId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Registro não encontrado" });
    return;
  }
  res.sendStatus(204);
});

export default router;
