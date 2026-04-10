import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, mealsTable } from "@workspace/db";
import { CreateMealBody, UpdateMealBody, UpdateMealParams, DeleteMealParams, ListMealsQueryParams } from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";

const router: IRouter = Router();

function serializeMeal(m: typeof mealsTable.$inferSelect) {
  return {
    id: m.id,
    name: m.name,
    category: m.category,
    description: m.description ?? null,
    caloriesKcal: Number(m.caloriesKcal),
    imageBase64: m.imageBase64 ?? null,
    aiAnalyzed: m.aiAnalyzed,
    date: m.date,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
  };
}

router.get("/meals", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const params = ListMealsQueryParams.safeParse(req.query);
  const date = params.success ? params.data.date : undefined;

  const conditions = [eq(mealsTable.userId, userId)];
  if (date) conditions.push(eq(mealsTable.date, date));

  const meals = await db.select().from(mealsTable)
    .where(and(...conditions))
    .orderBy(desc(mealsTable.createdAt));

  res.json(meals.map(serializeMeal));
});

router.post("/meals", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const parsed = CreateMealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [meal] = await db.insert(mealsTable).values({
    ...parsed.data,
    userId,
    aiAnalyzed: parsed.data.aiAnalyzed ?? false,
  }).returning();
  res.status(201).json(serializeMeal(meal));
});

router.patch("/meals/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateMealParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(mealsTable)
    .set(parsed.data)
    .where(and(eq(mealsTable.id, params.data.id), eq(mealsTable.userId, userId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }

  res.json(serializeMeal(updated));
});

router.delete("/meals/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteMealParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(mealsTable)
    .where(and(eq(mealsTable.id, params.data.id), eq(mealsTable.userId, userId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
