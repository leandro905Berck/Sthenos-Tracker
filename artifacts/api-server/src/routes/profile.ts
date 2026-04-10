import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { CreateProfileBody, UpdateProfileBody } from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";

const router: IRouter = Router();

function calcBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function calcBMR(weightKg: number, heightCm: number, age: number, gender: string): number {
  if (gender === "feminino" || gender === "female") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

function calcTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentario: 1.2,
    sedentário: 1.2,
    leve: 1.375,
    moderado: 1.55,
    intenso: 1.725,
    ativo: 1.725,
    muito_intenso: 1.9,
    muito_ativo: 1.9,
  };
  return bmr * (multipliers[activityLevel] ?? 1.375);
}

function serializeProfile(p: typeof profilesTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    age: p.age ?? null,
    gender: p.gender ?? null,
    weightKg: p.weightKg != null ? Number(p.weightKg) : null,
    heightCm: p.heightCm != null ? Number(p.heightCm) : null,
    goal: p.goal ?? null,
    activityLevel: p.activityLevel ?? null,
    bmi: p.bmi != null ? Number(p.bmi) : null,
    bmr: p.bmr != null ? Number(p.bmr) : null,
    tdee: p.tdee != null ? Number(p.tdee) : null,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
  };
}

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profiles = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (!profiles[0]) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(serializeProfile(profiles[0]));
});

router.post("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const parsed = CreateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  let bmi: string | undefined;
  let bmr: string | undefined;
  let tdee: string | undefined;

  const w = data.weightKg != null ? Number(data.weightKg) : null;
  const h = data.heightCm != null ? Number(data.heightCm) : null;
  const a = data.age ?? null;
  const g = data.gender ?? null;

  if (w && h) {
    bmi = calcBMI(w, h).toFixed(2);
    if (a && g) {
      const bmrVal = calcBMR(w, h, a, g);
      bmr = bmrVal.toFixed(2);
      if (data.activityLevel) {
        tdee = calcTDEE(bmrVal, data.activityLevel).toFixed(2);
      }
    }
  }

  const [profile] = await db.insert(profilesTable).values({
    ...data,
    userId,
    bmi,
    bmr,
    tdee,
    updatedAt: new Date(),
  }).returning();

  res.status(201).json(serializeProfile(profile));
});

router.patch("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  if (!existing[0]) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const data = parsed.data;
  const merged = { ...existing[0], ...data };
  const w = merged.weightKg != null ? Number(merged.weightKg) : null;
  const h = merged.heightCm != null ? Number(merged.heightCm) : null;
  const a = merged.age ?? null;
  const g = merged.gender ?? null;

  let bmi: string | undefined = existing[0].bmi ?? undefined;
  let bmr: string | undefined = existing[0].bmr ?? undefined;
  let tdee: string | undefined = existing[0].tdee ?? undefined;

  if (w && h) {
    bmi = calcBMI(w, h).toFixed(2);
    if (a && g) {
      const bmrVal = calcBMR(w, h, a, g);
      bmr = bmrVal.toFixed(2);
      if (merged.activityLevel) {
        tdee = calcTDEE(bmrVal, merged.activityLevel).toFixed(2);
      }
    }
  }

  const [updated] = await db.update(profilesTable)
    .set({ ...data, bmi, bmr, tdee, updatedAt: new Date() })
    .where(eq(profilesTable.userId, userId))
    .returning();

  res.json(serializeProfile(updated));
});

export default router;
