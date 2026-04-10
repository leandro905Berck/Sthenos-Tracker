import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, exercisesTable, mealsTable } from "@workspace/db";
import { GetDailyReportQueryParams, GetDailyReportHistoryQueryParams } from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function buildReport(date: string, userId: string) {
  const exercises = await db.select().from(exercisesTable)
    .where(and(eq(exercisesTable.date, date), eq(exercisesTable.userId, userId)));
  const meals = await db.select().from(mealsTable)
    .where(and(eq(mealsTable.date, date), eq(mealsTable.userId, userId)));

  const totalCaloriesBurned = exercises.reduce((sum, e) => sum + Number(e.caloriesBurned), 0);
  const totalCaloriesConsumed = meals.reduce((sum, m) => sum + Number(m.caloriesKcal), 0);
  const netCalories = totalCaloriesConsumed - totalCaloriesBurned;

  const breakfastCalories = meals.filter(m => m.category === "cafe" || m.category === "café").reduce((s, m) => s + Number(m.caloriesKcal), 0);
  const lunchCalories = meals.filter(m => m.category === "almoco" || m.category === "almoço").reduce((s, m) => s + Number(m.caloriesKcal), 0);
  const dinnerCalories = meals.filter(m => m.category === "janta").reduce((s, m) => s + Number(m.caloriesKcal), 0);
  const snackCalories = meals.filter(m => m.category === "lanche").reduce((s, m) => s + Number(m.caloriesKcal), 0);

  return {
    date,
    totalCaloriesBurned,
    totalCaloriesConsumed,
    netCalories,
    exerciseCount: exercises.length,
    mealCount: meals.length,
    breakfastCalories,
    lunchCalories,
    dinnerCalories,
    snackCalories,
  };
}

router.get("/daily-reports", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const params = GetDailyReportQueryParams.safeParse(req.query);
  const date = (params.success && params.data.date) ? params.data.date : new Date().toISOString().split("T")[0];
  const report = await buildReport(date, userId);
  res.json(report);
});

router.get("/daily-reports/history", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const params = GetDailyReportHistoryQueryParams.safeParse(req.query);
  const days = (params.success && params.data.days) ? params.data.days : 7;

  const reports = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const report = await buildReport(dateStr, userId);
    reports.push(report);
  }

  res.json(reports);
});

export default router;
