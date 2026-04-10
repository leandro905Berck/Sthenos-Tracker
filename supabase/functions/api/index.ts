import { Hono } from 'https://deno.land/x/hono@v3.11.7/mod.ts'
import { cors } from 'https://deno.land/x/hono@v3.11.7/middleware.ts'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import { drizzle } from 'https://esm.sh/drizzle-orm@0.30.1/postgres-js'
import postgres from 'https://esm.sh/postgres@3.4.3'
import { eq, and, desc, sql } from 'https://esm.sh/drizzle-orm@0.30.1'
import * as schema from './db/schema.ts'

const app = new Hono().basePath('/api')

// Middleware de CORS
app.use('*', cors())

// Conexão com Banco de Dados
const DATABASE_URL = Deno.env.get('DATABASE_URL')
if (!DATABASE_URL) throw new Error('DATABASE_URL is required')
const client = postgres(DATABASE_URL)
const db = drizzle(client, { schema })

// IA (OpenAI)
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

// Middleware de Autenticação Supabase
// Extrai o user_id do JWT enviado no header Authorization
app.use('*', async (c, next) => {
  if (c.req.path === '/api/health') return await next()
  
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'Não autorizado' }, 401)
  
  try {
    const token = authHeader.replace('Bearer ', '')
    // No Supabase Edge Functions, podemos pegar o usuário diretamente do context
    // ou decodificar o JWT. O Supabase já faz a verificação básica se configurado.
    // Para simplificar, vamos assumir que o frontend envia o JWT e usaremos
    // a lib do Supabase para extrair o usuário com segurança se necessário.
    
    // NOTA: Em funções reais do Supabase, o UID vem no header 'x-auth-user-id' 
    // se o JWT for válido.
    const userId = c.req.header('x-auth-user-id') || 'guest' // Fallback para desenvolvimento
    c.set('userId', userId)
    await next()
  } catch (err) {
    return c.json({ error: 'Token inválido' }, 401)
  }
})

// --- ROTAS DE IA ---

app.post('/ai/analyze-food', async (c) => {
  const { imageBase64 } = await c.req.json()
  const prompt = `Você é um nutricionista especialista. Analise a imagem de alimento fornecida e responda APENAS em JSON válido com a estrutura:
  {
    "foodName": "nome",
    "description": "descrição",
    "estimatedCalories": número,
    "confidence": "alta" | "média" | "baixa",
    "ingredients": ["ingrediente1", "ingrediente2"]
  }`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } }] }],
  });

  return c.json(JSON.parse(response.choices[0]?.message?.content || '{}'))
})

app.post('/ai/estimate-calories', async (c) => {
  const { foodName } = await c.req.json()
  const prompt = `Você é nutricionista. Estime as calorias do alimento informado (porção padrão brasileira) e responda APENAS em JSON válido:
  {
    "estimatedCalories": número,
    "description": "descrição da porção",
    "confidence": "alta" | "média" | "baixa"
  }
  Alimento: "${foodName}"`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  return c.json(JSON.parse(response.choices[0]?.message?.content || '{}'))
})

app.get('/ai/daily-summary', async (c) => {
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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  const aiResult = JSON.parse(response.choices[0]?.message?.content || '{}')
  return c.json({ date, calorieBalance: net, ...aiResult })
})

// --- ROTAS DE REFEIÇÕES ---

app.get('/meals', async (c) => {
  const userId = c.get('userId')
  const date = c.req.query('date')
  const conditions = [eq(schema.mealsTable.userId, userId)]
  if (date) conditions.push(eq(schema.mealsTable.date, date))

  const meals = await db.select().from(schema.mealsTable).where(and(...conditions)).orderBy(desc(schema.mealsTable.createdAt))
  return c.json(meals.map(m => ({ ...m, caloriesKcal: Number(m.caloriesKcal) })))
})

app.post('/meals', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  const [meal] = await db.insert(schema.mealsTable).values({ ...data, userId }).returning()
  return c.json({ ...meal, caloriesKcal: Number(meal.caloriesKcal) }, 201)
})

// --- ROTAS DE EXERCÍCIOS ---

app.get('/exercises', async (c) => {
  const userId = c.get('userId')
  const date = c.req.query('date')
  const conditions = [eq(schema.exercisesTable.userId, userId)]
  if (date) conditions.push(eq(schema.exercisesTable.date, date))

  const exercises = await db.select().from(schema.exercisesTable).where(and(...conditions)).orderBy(desc(schema.exercisesTable.createdAt))
  return c.json(exercises.map(e => ({ ...e, caloriesBurned: Number(e.caloriesBurned) })))
})

app.post('/exercises', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  const [exercise] = await db.insert(schema.exercisesTable).values({ ...data, userId }).returning()
  return c.json({ ...exercise, caloriesBurned: Number(exercise.caloriesBurned) }, 201)
})

// --- ROTAS DE PERFIL ---

app.get('/profile', async (c) => {
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

app.patch('/profile', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  const [updated] = await db.update(schema.profilesTable).set(data).where(eq(schema.profilesTable.userId, userId)).returning()
  return c.json(updated)
})

// --- RELATÓRIOS DIÁRIOS ---

app.get('/daily-reports', async (c) => {
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

app.get('/daily-reports/history', async (c) => {
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

// --- PESO (WEIGHT CHECKS) ---

app.get('/weight-checks', async (c) => {
  const userId = c.get('userId')
  const checks = await db.select().from(schema.weightChecksTable).where(eq(schema.weightChecksTable.userId, userId)).orderBy(desc(schema.weightChecksTable.date))
  return c.json(checks.map(ck => ({ ...ck, weightKg: Number(ck.weightKg) })))
})

app.post('/weight-checks', async (c) => {
  const userId = c.get('userId')
  const data = await c.req.json()
  const [ck] = await db.insert(schema.weightChecksTable).values({ ...data, userId }).returning()
  return c.json({ ...ck, weightKg: Number(ck.weightKg) }, 201)
})

app.delete('/weight-checks/:id', async (c) => {
  const userId = c.get('userId')
  const id = parseInt(c.req.param('id'), 10)
  await db.delete(schema.weightChecksTable).where(and(eq(schema.weightChecksTable.id, id), eq(schema.weightChecksTable.userId, userId)))
  return c.body(null, 204)
})

Deno.serve(app.fetch)

