import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, profilesTable, exercisesTable, mealsTable } from "@workspace/db";
import { AnalyzeFoodImageBody, GetAiDailySummaryQueryParams } from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";
import { requireAuth, getAuthUserId } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.post("/ai/analyze-food", requireAuth, async (req, res): Promise<void> => {
  const parsed = AnalyzeFoodImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { imageBase64 } = parsed.data;

  const prompt = `Você é um nutricionista especialista. Analise a imagem de alimento fornecida e responda APENAS em JSON válido (sem markdown, sem explicações) com a seguinte estrutura:
{
  "foodName": "nome do alimento em português",
  "description": "descrição curta do alimento em português",
  "estimatedCalories": número de calorias estimadas (apenas o número),
  "confidence": "alta" | "média" | "baixa",
  "ingredients": ["ingrediente1", "ingrediente2"]
}

Seja preciso nas calorias. Assuma uma porção normal/padrão se não for possível determinar pelo tamanho.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              detail: "low",
            },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  let result;
  try {
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    result = JSON.parse(clean);
  } catch {
    result = {
      foodName: "Alimento não identificado",
      description: "Não foi possível analisar a imagem",
      estimatedCalories: 0,
      confidence: "baixa",
      ingredients: [],
    };
  }

  res.json(result);
});

router.post("/ai/estimate-calories", requireAuth, async (req, res): Promise<void> => {
  const { foodName } = req.body;
  if (!foodName || typeof foodName !== "string") {
    res.status(400).json({ error: "foodName is required" });
    return;
  }

  const prompt = `Você é nutricionista. Estime as calorias do alimento informado e responda APENAS em JSON válido (sem markdown):
{
  "estimatedCalories": número (apenas o número inteiro),
  "description": "descrição curta da porção padrão considerada",
  "confidence": "alta" | "média" | "baixa"
}

Alimento: "${foodName}"
Assuma uma porção padrão típica brasileira.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch {
    res.json({ estimatedCalories: 0, description: "Não foi possível estimar", confidence: "baixa" });
  }
});

router.post("/ai/estimate-exercise-calories", requireAuth, async (req, res): Promise<void> => {
  const { exerciseName, type, duration, sets, reps } = req.body;
  if (!exerciseName || typeof exerciseName !== "string") {
    res.status(400).json({ error: "exerciseName is required" });
    return;
  }

  const context = type === "cardio"
    ? `Duração: ${duration || 30} minutos`
    : `Séries: ${sets || 3}, Repetições: ${reps || 10}`;

  const prompt = `Você é personal trainer. Estime as calorias gastas no exercício informado e responda APENAS em JSON válido (sem markdown):
{
  "estimatedCalories": número inteiro total de calorias,
  "description": "breve descrição da estimativa (porção/contexto considerado)",
  "confidence": "alta" | "média" | "baixa"
}

Exercício: "${exerciseName}"
Tipo: ${type === "cardio" ? "Cardio" : "Musculação/Academia"}
${context}

Assuma um adulto de porte médio. Considere intensidade moderada.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });
    const content = response.choices[0]?.message?.content ?? "{}";
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(clean);
    res.json(result);
  } catch {
    res.json({ estimatedCalories: 0, description: "Não foi possível estimar", confidence: "baixa" });
  }
});

router.get("/ai/daily-summary", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const params = GetAiDailySummaryQueryParams.safeParse(req.query);
  const date = (params.success && params.data.date) ? params.data.date : new Date().toISOString().split("T")[0];

  const exercises = await db.select().from(exercisesTable)
    .where(and(eq(exercisesTable.date, date), eq(exercisesTable.userId, userId)));
  const meals = await db.select().from(mealsTable)
    .where(and(eq(mealsTable.date, date), eq(mealsTable.userId, userId)));

  const totalCaloriesBurned = exercises.reduce((sum, e) => sum + Number(e.caloriesBurned), 0);
  const totalCaloriesConsumed = meals.reduce((sum, m) => sum + Number(m.caloriesKcal), 0);
  const netCalories = totalCaloriesConsumed - totalCaloriesBurned;

  const exerciseList = exercises.map(e => `${e.name} (${e.type}): ${e.caloriesBurned} kcal`).join(", ");
  const mealList = meals.map(m => `${m.name} (${m.category}): ${m.caloriesKcal} kcal`).join(", ");

  const prompt = `Você é um personal trainer e nutricionista. Analise os dados fitness do dia e responda APENAS em JSON válido (sem markdown):
{
  "summary": "resumo curto e motivador do dia em português (máximo 2 frases)",
  "insights": ["insight 1 em português", "insight 2 em português", "insight 3 em português"],
  "recommendation": "recomendação principal para amanhã em português"
}

Dados do dia ${date}:
- Calorias queimadas: ${totalCaloriesBurned.toFixed(0)} kcal
- Calorias consumidas: ${totalCaloriesConsumed.toFixed(0)} kcal
- Balanço calórico: ${netCalories.toFixed(0)} kcal (${netCalories > 0 ? "superávit" : "déficit"})
- Exercícios: ${exerciseList || "nenhum"}
- Refeições: ${mealList || "nenhuma"}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  let result;
  try {
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    result = JSON.parse(clean);
  } catch {
    result = {
      summary: "Continue se esforçando!",
      insights: ["Registre seus exercícios e refeições regularmente"],
      recommendation: "Mantenha a consistência nos treinos e na alimentação",
    };
  }

  res.json({
    date,
    calorieBalance: netCalories,
    ...result,
  });
});

router.get("/ai/diet-plan", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profiles = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
  const profile = profiles[0];

  const bmi = profile?.bmi ? Number(profile.bmi) : null;
  const tdee = profile?.tdee ? Number(profile.tdee) : 2000;
  const goal = profile?.goal ?? "manutenção";
  const gender = profile?.gender ?? "não informado";
  const age = profile?.age ?? null;

  let bmiCategory = "normal";
  if (bmi !== null) {
    if (bmi < 18.5) bmiCategory = "abaixo do peso";
    else if (bmi < 25) bmiCategory = "peso normal";
    else if (bmi < 30) bmiCategory = "sobrepeso";
    else bmiCategory = "obesidade";
  }

  let targetCalories = tdee;
  if (goal === "perda de peso") targetCalories = tdee - 500;
  else if (goal === "ganho muscular") targetCalories = tdee + 300;

  const prompt = `Você é nutricionista e personal trainer. Monte um plano alimentar personalizado e responda APENAS em JSON válido (sem markdown):
{
  "breakfastSuggestions": ["opção 1", "opção 2", "opção 3"],
  "lunchSuggestions": ["opção 1", "opção 2", "opção 3"],
  "dinnerSuggestions": ["opção 1", "opção 2", "opção 3"],
  "snackSuggestions": ["opção 1", "opção 2"],
  "generalAdvice": "conselho geral em português (2-3 frases)",
  "weeklyPlan": [
    {"day": "Segunda-feira", "meals": ["café: X", "almoço: X", "jantar: X", "lanche: X"], "totalCalories": número},
    {"day": "Terça-feira", "meals": ["café: X", "almoço: X", "jantar: X", "lanche: X"], "totalCalories": número},
    {"day": "Quarta-feira", "meals": ["café: X", "almoço: X", "jantar: X", "lanche: X"], "totalCalories": número},
    {"day": "Quinta-feira", "meals": ["café: X", "almoço: X", "jantar: X", "lanche: X"], "totalCalories": número},
    {"day": "Sexta-feira", "meals": ["café: X", "almoço: X", "jantar: X", "lanche: X"], "totalCalories": número},
    {"day": "Sábado", "meals": ["café: X", "almoço: X", "jantar: X", "lanche: X"], "totalCalories": número},
    {"day": "Domingo", "meals": ["café: X", "almoço: X", "jantar: X", "lanche: X"], "totalCalories": número}
  ]
}

Perfil do usuário:
- IMC: ${bmi ? bmi.toFixed(1) : "não calculado"} (${bmiCategory})
- Objetivo: ${goal}
- TDEE estimado: ${tdee.toFixed(0)} kcal/dia
- Meta calórica: ${targetCalories.toFixed(0)} kcal/dia
- Gênero: ${gender}
- Idade: ${age ?? "não informada"}

Adapte todas as sugestões ao contexto brasileiro. Use alimentos comuns no Brasil.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  let planData;
  try {
    const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    planData = JSON.parse(clean);
  } catch {
    planData = {
      breakfastSuggestions: ["Aveia com frutas", "Pão integral com ovo", "Iogurte com granola"],
      lunchSuggestions: ["Arroz, feijão, frango grelhado e salada", "Macarrão integral com atum", "Sopa de legumes"],
      dinnerSuggestions: ["Frango assado com legumes", "Omelete com salada", "Peixe grelhado com arroz integral"],
      snackSuggestions: ["Frutas da estação", "Castanhas e nozes"],
      generalAdvice: "Mantenha uma alimentação equilibrada e variada.",
      weeklyPlan: [],
    };
  }

  res.json({
    bmi,
    bmiCategory,
    targetCalories,
    ...planData,
  });
});

export default router;
