import { pgTable, serial, text, integer, numeric, timestamp, boolean, date } from 'https://esm.sh/drizzle-orm@0.30.1/pg-core'

export const profilesTable = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  age: integer('age'),
  gender: text('gender'),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
  heightCm: numeric('height_cm', { precision: 5, scale: 2 }),
  goal: text('goal'),
  activityLevel: text('activity_level'),
  bmi: numeric('bmi', { precision: 5, scale: 2 }),
  bmr: numeric('bmr', { precision: 7, scale: 2 }),
  tdee: numeric('tdee', { precision: 7, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const exercisesTable = pgTable('exercises', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  durationMinutes: integer('duration_minutes'),
  sets: integer('sets'),
  reps: integer('reps'),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
  caloriesBurned: numeric('calories_burned', { precision: 7, scale: 2 }).notNull(),
  notes: text('notes'),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: text('user_id'),
})

export const mealsTable = pgTable('meals', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  caloriesKcal: numeric('calories_kcal', { precision: 7, scale: 2 }).notNull(),
  imageBase64: text('image_base64'),
  aiAnalyzed: boolean('ai_analyzed').default(false).notNull(),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const weightChecksTable = pgTable('weight_checks', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }).notNull(),
  date: date('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
