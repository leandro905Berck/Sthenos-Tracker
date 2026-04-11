import { Hono } from 'https://deno.land/x/hono@v3.11.7/mod.ts'
import { cors } from 'https://deno.land/x/hono@v3.11.7/middleware.ts'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import { drizzle } from 'https://esm.sh/drizzle-orm@0.30.1/postgres-js'
import postgres from 'https://esm.sh/postgres@3.4.3'
import { eq, and, desc, sql as dSql } from 'https://esm.sh/drizzle-orm@0.30.1'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import * as schema from './db/schema.ts'

// Strips markdown code fences OpenAI sometimes wraps JSON in
function safeParseJSON(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {}
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    return {}
  }
}

const app = new Hono()

// 1. CORS Global - Deve ser o primeiro de todos
app.use('*', cors())

// 2. Rota de Saúde (Pública)
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// 3. Sub-App para as rotas da API (Protegidas)
const api = new Hono()

// Configuração inicial de clients
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })
const pgClient = postgres(Deno.env.get('SUPABASE_DB_URL')!)
const db = drizzle(pgClient)

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_ANON_KEY') || ''
)

// Middleware de Autenticação Supabase Manual
api.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ error: 'Missing Authorization header' }, 401)
  }
  
  const token = authHeader.replace('Bearer ', '').trim()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return c.json({ error: 'Unauthorized: Invalid JWT' }, 401)
  }

  c.set('userId', user.id)
  await next()
})

// --- ROTAS DA API ---

api.post('/ai/analyze-food', async (c) => {
  const { imageBase64 } = await c.req.json()
  const prompt = `Você é um nutricionista especialista. Analise a imagem de alimento fornecida e responda APENAS em JSON válido com a estrutura:
  {
    "foodName": "nome",
    "description": "descrição",
    "estimatedCalories": número,
    "confidence": "alta" | "média" | "baixa",
    "ingredients": ["ingrediente1", "ingrediente2"]
  }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } }] }],
    });

    return c.json(safeParseJSON(response.choices[0]?.message?.content))
  } catch (error: any) {
    console.error("OpenAI Error in analyze-food:", error?.message || error)
    return c.json({ error: "Erro ao analisar o alimento com IA. Tente novamente mais tarde.", details: error?.message || "Erro desconhecido" }, 500)
  }
})

api.post('/ai/estimate-calories', async (c) => {
  const { foodName } = await c.req.json()
  const prompt = `Você é nutricionista. Estime as calorias do alimento informado (porção padrão brasileira) e responda APENAS em JSON válido:
  {
    "estimatedCalories": número,
    "description": "descrição da porção",
    "confidence": "alta" | "média" | "baixa"
  }
  Alimento: "${foodName}"`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return c.json(safeParseJSON(response.choices[0]?.message?.content))
  } catch (error: any) {
    console.error("OpenAI Error in estimate-calories:", error?.message || error)
    return c.json({ error: "Erro ao estimar calorias com IA.", details: error?.message || "Erro desconhecido" }, 500)
  }
})

api.get('/ai/daily-summary', async (c) => {
  const userId = c.get('userId')
  const date = c.req.query('date') || new Date().toISOString().split('T')[0]

  const exercises = await db.select().from(schema.exercisesTable).where(and(eq(schema.exercisesTable.date, date), eq(schema.exercisesTable.userId, userId)))
  const meals = await db.select().from(schema.mealsTable).where(and(eq(schema.mealsTable.date, date), eq(schema.mealsTable.userId, userId)))

  const totalBurned = exercises.reduce((s, e) => s + Number(e.caloriesBurned), 0)
  const totalConsumed = meals.reduce((s, m) => s + Number(m.caloriesKcal), 0)
  const net = totalConsumed - totalBurned

  const prompt = `Você é um personal trainer e nutricionista. Analise:
  - Consumidas: ${totalConsumed} kcal
  - Queimadas: ${totalBurned} kcal
  Responda em JSON: { "summary": "texto", "insights": ["i1", "i2"], "recommendation": "texto" }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const aiResult = safeParseJSON(response.choices[0]?.message?.content)
    return c.json({ date, calorieBalance: net, ...aiResult })
  } catch (error: any) {
    console.error("OpenAI Error in daily-summary:", error?.message || error)
    return c.json({
      date,
      calorieBalance: net,
      summary: "Não foi possível gerar um resumo de IA no momento.",
      insights: ["A análise de IA está indisponível."],
      recommendation: "Continue registrando suas refeições e exercícios!"
    })
  }
})

api.get('/meals', async (c) => {
  const userId = c.get('userId')
  const date = c.req.query('date')
  const conditions = [eq(schema.mealsTable.userId, userId)]
  if (date) conditions.push(eq(schema.mealsTable.date, date))

  const meals = await db.select().from(schema.mealsTable).where(and(...conditions)).orderBy(desc(schema.mealsTable.createdAt))
  return c.json(meals.map(m => ({ ...m, caloriesKcal: Number(m.caloriesKcal) })))
})

api.post('/meals', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  const [meal] = await db.insert(schema.mealsTable).values({ ...data, userId }).returning()
  return c.json({ ...meal, caloriesKcal: Number(meal.caloriesKcal) }, 201)
})

api.get('/exercises', async (c) => {
  const userId = c.get('userId')
  const date = c.req.query('date')
  const conditions = [eq(schema.exercisesTable.userId, userId)]
  if (date) conditions.push(eq(schema.exercisesTable.date, date))

  const exercises = await db.select().from(schema.exercisesTable).where(and(...conditions)).orderBy(desc(schema.exercisesTable.createdAt))
  return c.json(exercises.map(e => ({ ...e, caloriesBurned: Number(e.caloriesBurned) })))
})

api.post('/exercises', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  const [exercise] = await db.insert(schema.exercisesTable).values({ ...data, userId }).returning()
  return c.json({ ...exercise, caloriesBurned: Number(exercise.caloriesBurned) }, 201)
})

api.get('/profile', async (c) => {
  const userId = c.get('userId')
  const [profile] = await db.select().from(schema.profilesTable).where(eq(schema.profilesTable.userId, userId)).limit(1)
  if (!profile) return c.json({ error: 'Perfil não encontrado' }, 404)
  return c.json({
    ...profile,
    weightKg: profile.weightKg ? Number(profile.weightKg) : null,
    heightCm: profile.heightCm ? Number(profile.heightCm) : null,
    bmi: profile.bmi ? Number(profile.bmi) : null,
    bmr: profile.bmr ? Number(profile.bmr) : null,
    tdee: profile.tdee ? Number(profile.tdee) : null,
  })
})

api.post('/profile', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  const [profile] = await db.insert(schema.profilesTable).values({ ...data, userId }).returning()
  return c.json(profile)
})

api.patch('/profile', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  const [updated] = await db.update(schema.profilesTable).set(data).where(eq(schema.profilesTable.userId, userId)).returning()
  return c.json(updated)
})

api.get('/daily-reports', async (c) => {
  const userId = c.get('userId')
  const dateStr = c.req.query('date') || new Date().toISOString().split('T')[0]

  const exercises = await db.select().from(schema.exercisesTable).where(and(eq(schema.exercisesTable.date, dateStr), eq(schema.exercisesTable.userId, userId)))
  const meals = await db.select().from(schema.mealsTable).where(and(eq(schema.mealsTable.date, dateStr), eq(schema.mealsTable.userId, userId)))

  const burned = exercises.reduce((s, e) => s + Number(e.caloriesBurned), 0)
  const consumed = meals.reduce((s, m) => s + Number(m.caloriesKcal), 0)

  return c.json({
    date: dateStr,
    totalCaloriesBurned: burned,
    totalCaloriesConsumed: consumed,
    netCalories: consumed - burned,
    exerciseCount: exercises.length,
    mealCount: meals.length
  })
})

api.get('/daily-reports/history', async (c) => {
  const userId = c.get('userId')
  const days = parseInt(c.req.query('days') || '7', 10)
  const reports = []
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    
    const exercises = await db.select().from(schema.exercisesTable).where(and(eq(schema.exercisesTable.date, dateStr), eq(schema.exercisesTable.userId, userId)))
    const meals = await db.select().from(schema.mealsTable).where(and(eq(schema.mealsTable.date, dateStr), eq(schema.mealsTable.userId, userId)))
    
    const burned = exercises.reduce((s, e) => s + Number(e.caloriesBurned), 0)
    const consumed = meals.reduce((s, m) => s + Number(m.caloriesKcal), 0)
    
    reports.push({
      date: dateStr,
      totalCaloriesBurned: burned,
      totalCaloriesConsumed: consumed,
      netCalories: consumed - burned,
      exerciseCount: exercises.length,
      mealCount: meals.length
    })
  }
  return c.json(reports)
})

api.get('/weight-checks', async (c) => {
  const userId = c.get('userId')
  const checks = await db.select().from(schema.weightChecksTable).where(eq(schema.weightChecksTable.userId, userId)).orderBy(desc(schema.weightChecksTable.date))
  return c.json(checks.map(ck => ({ ...ck, weightKg: Number(ck.weightKg) })))
})

api.get('/weight-checks/pending', async (c) => {
  const userId = c.get('userId')
  const [latest] = await db
    .select()
    .from(schema.weightChecksTable)
    .where(eq(schema.weightChecksTable.userId, userId))
    .orderBy(desc(schema.weightChecksTable.date))
    .limit(1)

  if (!latest) {
    return c.json({ isPending: true, daysSinceLastCheck: null })
  }

  const lastDate = new Date(latest.date)
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  return c.json({ isPending: diffDays >= 7, daysSinceLastCheck: diffDays })
})

api.post('/weight-checks', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  const [ck] = await db.insert(schema.weightChecksTable).values({ ...data, userId }).returning()
  return c.json({ ...ck, weightKg: Number(ck.weightKg) }, 201)
})

api.delete('/weight-checks/:id', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'), 10)
  await db.delete(schema.weightChecksTable).where(and(eq(schema.weightChecksTable.id, id), eq(schema.weightChecksTable.userId, userId)))
  return c.body(null, 204)
})

// 4. Conectar Rotas e Iniciar Servidor Deno com Handler de CORS Manual
app.route('/api', api)

Deno.serve(async (req) => {
  const { method } = req

  // Tratamento manual de preflight (OPTIONS)
  // Isso garante que o navegador receba um OK 200 imediato para prosseguir
  if (method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      },
      status: 200
    })
  }

  // Passa todos os outros tipos de pedido (GET, POST, etc) para o Hono
  return app.fetch(req)
})

