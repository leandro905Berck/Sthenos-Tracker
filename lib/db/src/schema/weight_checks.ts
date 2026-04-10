import { pgTable, serial, numeric, text, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const weightChecksTable = pgTable("weight_checks", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWeightCheckSchema = createInsertSchema(weightChecksTable).omit({ id: true, createdAt: true });
export type InsertWeightCheck = z.infer<typeof insertWeightCheckSchema>;
export type WeightCheck = typeof weightChecksTable.$inferSelect;
