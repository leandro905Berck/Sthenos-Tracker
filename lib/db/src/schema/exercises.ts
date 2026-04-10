import { pgTable, serial, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exercisesTable = pgTable("exercises", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  type: text("type").notNull(),
  durationMinutes: integer("duration_minutes"),
  sets: integer("sets"),
  reps: integer("reps"),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
  caloriesBurned: numeric("calories_burned", { precision: 7, scale: 2 }).notNull(),
  notes: text("notes"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExerciseSchema = createInsertSchema(exercisesTable).omit({ id: true, createdAt: true });
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercisesTable.$inferSelect;
