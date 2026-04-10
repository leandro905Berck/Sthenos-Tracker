import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, exercisesTable } from "@workspace/db";
import { CreateExerciseBody, UpdateExerciseBody, UpdateExerciseParams, DeleteExerciseParams, ListExercisesQueryParams } from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";

const router: IRouter = Router();

function serializeExercise(e: typeof exercisesTable.$inferSelect) {
  return {
    id: e.id,
    name: e.name,
    type: e.type,
    durationMinutes: e.durationMinutes ?? null,
    sets: e.sets ?? null,
    reps: e.reps ?? null,
    weightKg: e.weightKg != null ? Number(e.weightKg) : null,
    caloriesBurned: Number(e.caloriesBurned),
    notes: e.notes ?? null,
    date: e.date,
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
  };
}

router.get("/exercises", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const params = ListExercisesQueryParams.safeParse(req.query);
  const date = params.success ? params.data.date : undefined;

  const conditions = [eq(exercisesTable.userId, userId)];
  if (date) conditions.push(eq(exercisesTable.date, date));

  const exercises = await db.select().from(exercisesTable)
    .where(and(...conditions))
    .orderBy(desc(exercisesTable.createdAt));

  res.json(exercises.map(serializeExercise));
});

router.post("/exercises", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const parsed = CreateExerciseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [exercise] = await db.insert(exercisesTable).values({ ...parsed.data, userId }).returning();
  res.status(201).json(serializeExercise(exercise));
});

router.patch("/exercises/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateExerciseParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExerciseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(exercisesTable)
    .set(parsed.data)
    .where(and(eq(exercisesTable.id, params.data.id), eq(exercisesTable.userId, userId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }

  res.json(serializeExercise(updated));
});

router.delete("/exercises/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteExerciseParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(exercisesTable)
    .where(and(eq(exercisesTable.id, params.data.id), eq(exercisesTable.userId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
